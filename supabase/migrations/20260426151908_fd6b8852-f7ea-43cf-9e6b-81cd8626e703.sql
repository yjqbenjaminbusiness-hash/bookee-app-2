-- 1. Refresh the vault secret used by the trigger to authenticate to the email function.
-- The previous value was rejected with HTTP 403; re-read it from the platform setting.
DO $$
DECLARE
  _current_key text;
  _existing_id uuid;
BEGIN
  -- Read the current service role key from the project's GUC (set by Supabase platform)
  BEGIN
    _current_key := current_setting('app.settings.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    _current_key := NULL;
  END;

  IF _current_key IS NULL OR length(_current_key) < 20 THEN
    -- Fallback: try alternate GUC names some environments use
    BEGIN
      _current_key := current_setting('supabase.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      _current_key := NULL;
    END;
  END IF;

  IF _current_key IS NOT NULL AND length(_current_key) >= 20 THEN
    SELECT id INTO _existing_id
      FROM vault.secrets
      WHERE name = 'welcome_trigger_service_role_key'
      LIMIT 1;

    IF _existing_id IS NOT NULL THEN
      PERFORM vault.update_secret(_existing_id, _current_key, 'welcome_trigger_service_role_key');
    ELSE
      PERFORM vault.create_secret(_current_key, 'welcome_trigger_service_role_key');
    END IF;
  ELSE
    RAISE WARNING 'Could not read service_role_key from GUCs; vault secret left unchanged. Update manually if 403 errors persist.';
  END IF;
END $$;

-- 2. Replace the trigger function with a fixed version:
--    - 30s HTTP timeout (was 5s)
--    - Stamp welcome_email_sent_at AFTER successful enqueue (was before)
--    - Surface failures via RAISE WARNING in Postgres logs
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  _service_key text;
  _project_url text := 'https://oqcnonsmhcbrufmjdzdf.supabase.co';
  _payload jsonb;
  _request_id bigint;
BEGIN
  -- Skip if no email or already sent
  IF NEW.email IS NULL OR NEW.welcome_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get service role key from vault
  SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets
    WHERE name = 'welcome_trigger_service_role_key'
    LIMIT 1;

  IF _service_key IS NULL THEN
    RAISE WARNING '[welcome-email] welcome_trigger_service_role_key not found in vault; skipping for user_id=%', NEW.user_id;
    RETURN NEW;
  END IF;

  _payload := jsonb_build_object(
    'templateName', 'welcome',
    'recipientEmail', NEW.email,
    'idempotencyKey', 'welcome-' || NEW.user_id::text,
    'templateData', jsonb_build_object(
      'name', COALESCE(NEW.display_name, split_part(NEW.email, '@', 1))
    )
  );

  BEGIN
    -- pg_net is async — this returns a request_id immediately and queues the HTTP call
    _request_id := net.http_post(
      url := _project_url || '/functions/v1/send-transactional-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key,
        'apikey', _service_key
      ),
      body := _payload,
      timeout_milliseconds := 30000
    );

    -- Stamp AFTER successful queueing (not before)
    UPDATE public.profiles
      SET welcome_email_sent_at = now()
      WHERE user_id = NEW.user_id AND welcome_email_sent_at IS NULL;

    RAISE NOTICE '[welcome-email] queued request_id=% for user_id=% email=%', _request_id, NEW.user_id, NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[welcome-email] net.http_post failed for user_id=% : %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[welcome-email] send_welcome_email_on_profile crashed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3. One-time backfill: fire the trigger for every existing profile that never got a welcome email.
-- We do this by performing a no-op UPDATE on those rows; the trigger already exists on profiles
-- and is gated by welcome_email_sent_at IS NULL, so this safely (re)dispatches one welcome per user.
-- Idempotency keys (welcome-<user_id>) inside send-transactional-email prevent duplicate sends.
DO $$
DECLARE
  _profile RECORD;
  _service_key text;
  _project_url text := 'https://oqcnonsmhcbrufmjdzdf.supabase.co';
  _payload jsonb;
  _request_id bigint;
  _count int := 0;
BEGIN
  SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets
    WHERE name = 'welcome_trigger_service_role_key'
    LIMIT 1;

  IF _service_key IS NULL THEN
    RAISE WARNING '[welcome-backfill] vault key missing — skipping backfill';
    RETURN;
  END IF;

  FOR _profile IN
    SELECT user_id, email, display_name
    FROM public.profiles
    WHERE welcome_email_sent_at IS NULL
      AND email IS NOT NULL
  LOOP
    _payload := jsonb_build_object(
      'templateName', 'welcome',
      'recipientEmail', _profile.email,
      'idempotencyKey', 'welcome-' || _profile.user_id::text,
      'templateData', jsonb_build_object(
        'name', COALESCE(_profile.display_name, split_part(_profile.email, '@', 1))
      )
    );

    BEGIN
      _request_id := net.http_post(
        url := _project_url || '/functions/v1/send-transactional-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _service_key,
          'apikey', _service_key
        ),
        body := _payload,
        timeout_milliseconds := 30000
      );

      UPDATE public.profiles
        SET welcome_email_sent_at = now()
        WHERE user_id = _profile.user_id;

      _count := _count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[welcome-backfill] failed for user_id=% : %', _profile.user_id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '[welcome-backfill] dispatched % welcome emails', _count;
END $$;
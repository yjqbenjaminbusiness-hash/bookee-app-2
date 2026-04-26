-- 1. Ensure pg_net is available (used to call edge function from trigger)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Store service role key in Vault for trigger use (idempotent)
DO $$
DECLARE
  _key text;
BEGIN
  -- Try to read existing
  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'welcome_trigger_service_role_key' LIMIT 1;
  -- If not present, attempt to copy from email_queue_service_role_key (set up by email infra)
  IF _key IS NULL THEN
    SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
    IF _key IS NOT NULL THEN
      PERFORM vault.create_secret(_key, 'welcome_trigger_service_role_key', 'Service role key used by welcome email trigger');
    END IF;
  END IF;
END $$;

-- 3. Trigger function: invoke send-transactional-email via pg_net
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  _service_key text;
  _project_url text := 'https://oqcnonsmhcbrufmjdzdf.supabase.co';
  _payload jsonb;
BEGIN
  -- Skip if no email or already sent
  IF NEW.email IS NULL OR NEW.welcome_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Stamp first to prevent double-send on retries
  UPDATE public.profiles
    SET welcome_email_sent_at = now()
    WHERE user_id = NEW.user_id AND welcome_email_sent_at IS NULL;

  -- Get service role key from vault
  SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets
    WHERE name = 'welcome_trigger_service_role_key'
    LIMIT 1;

  IF _service_key IS NULL THEN
    RAISE WARNING 'welcome_trigger_service_role_key not found in vault; skipping welcome email';
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

  PERFORM net.http_post(
    url := _project_url || '/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key,
      'apikey', _service_key
    ),
    body := _payload,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send_welcome_email_on_profile failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Trigger on profiles insert (handle_new_user already creates a profile per auth.users insert)
DROP TRIGGER IF EXISTS trg_send_welcome_email ON public.profiles;
CREATE TRIGGER trg_send_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.send_welcome_email_on_profile();
CREATE OR REPLACE FUNCTION public._test_fire_welcome(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public, extensions
AS $$
DECLARE
  _service_key text;
  _project_url text := 'https://oqcnonsmhcbrufmjdzdf.supabase.co';
  _request_id bigint;
BEGIN
  SELECT decrypted_secret INTO _service_key
    FROM vault.decrypted_secrets WHERE name = 'welcome_trigger_service_role_key' LIMIT 1;
  IF _service_key IS NULL THEN
    RETURN jsonb_build_object('error', 'no key');
  END IF;

  SELECT net.http_post(
    url := _project_url || '/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key,
      'apikey', _service_key
    ),
    body := jsonb_build_object(
      'templateName', 'welcome',
      'recipientEmail', p_email,
      'idempotencyKey', 'welcome-test-' || extract(epoch from now())::text,
      'templateData', jsonb_build_object('name', 'Verification Test')
    ),
    timeout_milliseconds := 10000
  ) INTO _request_id;

  RETURN jsonb_build_object('request_id', _request_id);
END;
$$;
CREATE OR REPLACE FUNCTION public._check_welcome_vault_key()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE _k text;
BEGIN
  SELECT decrypted_secret INTO _k FROM vault.decrypted_secrets WHERE name = 'welcome_trigger_service_role_key' LIMIT 1;
  RETURN _k IS NOT NULL;
END;
$$;
-- Remove Legacy Authentication Migration
-- This migration removes email/password authentication and enforces Web3Auth-only

-- Remove email provider from auth_provider_type (keep only social providers)
DELETE FROM public.auth_provider_type WHERE provider_name = 'email';

-- Remove any legacy email/password user_auth records (provider_id = 1 was email)
-- This will cascade delete through foreign keys
DELETE FROM public.user_auth WHERE provider_id = 1;

-- Add constraint to enforce Web3Auth-only authentication
-- Only allow Google (2) and other social providers, no email/password (1)
ALTER TABLE public.user_auth
ADD CONSTRAINT user_auth_web3auth_only
CHECK (provider_id > 1);

-- Add comment for documentation
COMMENT ON CONSTRAINT user_auth_web3auth_only ON public.user_auth
IS 'Enforces Web3Auth-only authentication by preventing email/password (provider_id=1) records';

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE 'Legacy authentication removal completed successfully';
    RAISE NOTICE 'Email provider and email/password auth records removed';
    RAISE NOTICE 'System now enforces Web3Auth-only authentication';
END $$;

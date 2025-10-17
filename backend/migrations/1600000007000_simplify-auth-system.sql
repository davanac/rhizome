-- Simplify Authentication System Migration
-- This migration removes legacy authentication complexity and creates a clean Web3Auth-only system

-- Drop legacy authentication tables
DROP TABLE IF EXISTS public.user_auth CASCADE;
DROP TABLE IF EXISTS public.auth_provider_type CASCADE;

-- Create simplified user sessions table for refresh token management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    refresh_token text UNIQUE NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON public.user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Add trigger to clean up expired sessions automatically
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to run cleanup on insert (periodic cleanup)
CREATE TRIGGER cleanup_expired_sessions_trigger
AFTER INSERT ON public.user_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_sessions();

-- Grant necessary permissions
-- GRANT ALL PRIVILEGES ON public.user_sessions TO your_app_user;

-- Add comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Simplified session management for Web3Auth users';
COMMENT ON COLUMN public.user_sessions.user_id IS 'Reference to the authenticated user';
COMMENT ON COLUMN public.user_sessions.refresh_token IS 'JWT refresh token for session management';
COMMENT ON COLUMN public.user_sessions.expires_at IS 'Token expiration timestamp';

-- Final clean authentication system:
-- 1. users - Basic user information
-- 2. web3auth_users - Web3Auth authentication data and wallet addresses
-- 3. user_sessions - Simple refresh token management

DO $$
BEGIN
    RAISE NOTICE 'Authentication system simplification completed';
    RAISE NOTICE 'Removed: user_auth, auth_provider_type tables';
    RAISE NOTICE 'Added: user_sessions table for simplified token management';
    RAISE NOTICE 'System now uses Web3Auth as single authentication source';
END $$;

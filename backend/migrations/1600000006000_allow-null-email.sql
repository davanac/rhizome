-- Migration to allow NULL email for Web3Auth users (e.g., MetaMask users)
-- Some Web3Auth providers like MetaMask don't provide email addresses

-- Make email column nullable in users table
ALTER TABLE public.users
ALTER COLUMN email DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.users.email IS 'User email address. Can be NULL for Web3Auth users who authenticate with wallet-only providers like MetaMask';

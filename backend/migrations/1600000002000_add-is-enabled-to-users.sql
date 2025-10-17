-- Add is_enabled column to users table for soft delete functionality
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

-- Add index for performance when filtering by enabled status
CREATE INDEX IF NOT EXISTS idx_users_is_enabled ON public.users(is_enabled);

-- Update existing users to be enabled by default (redundant but explicit)
UPDATE public.users SET is_enabled = true WHERE is_enabled IS NULL;

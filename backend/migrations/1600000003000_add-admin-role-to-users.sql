-- Add admin role column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create index on is_admin column for performance
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);

-- Add comment to document the column
COMMENT ON COLUMN public.users.is_admin IS 'Boolean flag indicating if user has admin privileges';

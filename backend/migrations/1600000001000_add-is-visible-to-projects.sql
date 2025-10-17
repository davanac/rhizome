-- Add is_visible column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Add index for performance when filtering by visibility
CREATE INDEX IF NOT EXISTS idx_projects_is_visible ON public.projects(is_visible);

-- Update existing projects to be visible by default (redundant but explicit)
UPDATE public.projects SET is_visible = true WHERE is_visible IS NULL;

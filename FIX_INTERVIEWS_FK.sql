-- Fix interviews table foreign key constraint
-- Remove the foreign key constraint on user_id to allow anonymous interviews

ALTER TABLE IF EXISTS public.interviews DROP CONSTRAINT IF EXISTS interviews_user_id_fkey;

-- Optionally add it back as a non-enforced reference or keep it removed for anonymous support
-- For now, we'll keep it removed to allow anonymous candidates to save interviews

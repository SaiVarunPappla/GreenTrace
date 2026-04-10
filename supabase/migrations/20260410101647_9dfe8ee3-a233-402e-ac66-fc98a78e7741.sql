
-- Remove the overly broad policy we just added
DROP POLICY IF EXISTS "Authenticated can read display names" ON public.profiles;

-- Drop the view since we'll use an RPC instead
DROP VIEW IF EXISTS public.public_profiles;

-- Create a secure function to get public profile data (no employee_id exposed)
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM public.profiles p;
$$;


-- Recreate view with SECURITY INVOKER to respect RLS
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
  WITH (security_invoker = true)
  AS SELECT id, display_name FROM public.profiles;

-- Grant access
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- We also need a policy that allows reading display_name for all authenticated users
-- Since the view queries profiles, we need a limited SELECT policy for this
CREATE POLICY "Authenticated can read display names"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

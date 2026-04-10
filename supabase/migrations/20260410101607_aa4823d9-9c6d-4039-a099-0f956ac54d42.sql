
-- 1. Fix profiles SELECT policy: restrict to owner-only
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Create a public view for display_name (used by leaderboard/org view)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name
  FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- 3. Fix department_challenges INSERT policy: only challenger dept members can create
DROP POLICY IF EXISTS "Authenticated users can insert challenges" ON public.department_challenges;

CREATE POLICY "Members can create challenges for own department"
  ON public.department_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.department_members
      WHERE department_members.user_id = auth.uid()
        AND department_members.department_id = challenger_dept_id
    )
  );

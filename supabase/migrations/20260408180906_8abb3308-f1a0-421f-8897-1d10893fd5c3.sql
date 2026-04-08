-- Drop existing restrictive select policy
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Create broader read policy for org view
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a SECURITY DEFINER function to check department membership without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_department_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.department_members WHERE user_id = _user_id;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read same-department members" ON public.department_members;

-- Create a non-recursive policy using the SECURITY DEFINER function
CREATE POLICY "Users can read same-department members"
  ON public.department_members FOR SELECT TO authenticated
  USING (
    department_id IN (SELECT public.get_user_department_ids(auth.uid()))
  );

-- Fix 1: Add explicit UPDATE policy on activities table (owner-only)
CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: Restrict department_members SELECT to same-department members
DROP POLICY IF EXISTS "Authenticated users can read department members" ON public.department_members;

CREATE POLICY "Users can read same-department members"
  ON public.department_members FOR SELECT TO authenticated
  USING (
    department_id IN (
      SELECT dm.department_id FROM public.department_members dm WHERE dm.user_id = auth.uid()
    )
  );

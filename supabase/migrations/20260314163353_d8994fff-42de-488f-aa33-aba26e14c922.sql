ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_mode boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.department_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenger_dept_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  defender_dept_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL DEFAULT 'no-car',
  target_date date NOT NULL,
  is_active boolean DEFAULT true,
  winner_dept_id uuid REFERENCES public.departments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.department_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read challenges" ON public.department_challenges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert challenges" ON public.department_challenges
  FOR INSERT TO authenticated WITH CHECK (true);
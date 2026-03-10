
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read departments"
  ON public.departments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read department members"
  ON public.department_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own membership"
  ON public.department_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own membership"
  ON public.department_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO public.departments (name) VALUES
  ('Engineering'),
  ('Marketing'),
  ('Sales'),
  ('Operations'),
  ('HR'),
  ('Finance'),
  ('Design'),
  ('Product');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auto_track_enabled boolean DEFAULT false;

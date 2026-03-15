
-- Add 'clevel' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clevel';

-- 1. vciso_log_entries
CREATE TABLE public.vciso_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'outro',
  title text NOT NULL,
  description text,
  hours_spent numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vciso_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org log entries" ON public.vciso_log_entries
  FOR ALL TO public USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can view org log entries" ON public.vciso_log_entries
  FOR SELECT TO public USING (user_belongs_to_org(auth.uid(), organization_id));

-- 2. key_risk_indicators
CREATE TABLE public.key_risk_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework_id uuid REFERENCES public.frameworks(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  current_value numeric DEFAULT 0,
  target_value numeric DEFAULT 0,
  unit text NOT NULL DEFAULT '%',
  trend text NOT NULL DEFAULT 'stable',
  severity text NOT NULL DEFAULT 'low',
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.key_risk_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org KRIs" ON public.key_risk_indicators
  FOR ALL TO public USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can view org KRIs" ON public.key_risk_indicators
  FOR SELECT TO public USING (user_belongs_to_org(auth.uid(), organization_id));

-- 3. strategic_roadmap_items
CREATE TABLE public.strategic_roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text DEFAULT 'security',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  priority text NOT NULL DEFAULT 'media',
  assigned_to uuid,
  quarter text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org roadmap" ON public.strategic_roadmap_items
  FOR ALL TO public USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can view org roadmap" ON public.strategic_roadmap_items
  FOR SELECT TO public USING (user_belongs_to_org(auth.uid(), organization_id));

-- 4. continuity_tests
CREATE TABLE public.continuity_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  test_type text NOT NULL DEFAULT 'tabletop',
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  executed_date date,
  status text NOT NULL DEFAULT 'agendado',
  lessons_learned text,
  report_url text,
  conducted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.continuity_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage org continuity tests" ON public.continuity_tests
  FOR ALL TO public USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can view org continuity tests" ON public.continuity_tests
  FOR SELECT TO public USING (user_belongs_to_org(auth.uid(), organization_id));

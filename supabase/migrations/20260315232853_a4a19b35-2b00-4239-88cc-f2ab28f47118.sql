
-- Create KRI history table for tracking historical values
CREATE TABLE public.kri_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kri_id UUID NOT NULL REFERENCES public.key_risk_indicators(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kri_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view org KRI history"
  ON public.kri_history
  FOR SELECT
  TO public
  USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can manage org KRI history"
  ON public.kri_history
  FOR ALL
  TO public
  USING (user_belongs_to_org(auth.uid(), organization_id));

-- Add threshold columns to key_risk_indicators
ALTER TABLE public.key_risk_indicators
  ADD COLUMN IF NOT EXISTS threshold_warning NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS threshold_critical NUMERIC DEFAULT NULL;

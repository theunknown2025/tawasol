-- Opportunity: contract type + duration date range

ALTER TABLE public.lp_opportunities
  ADD COLUMN IF NOT EXISTS contract_type text CHECK (
    contract_type IS NULL
    OR contract_type IN ('stage', 'mission', 'projet', 'freelance', 'cdd', 'cdi', 'anapec')
  ),
  ADD COLUMN IF NOT EXISTS duration_start date,
  ADD COLUMN IF NOT EXISTS duration_end date;

-- Event period as date range; inscription deadline date-only (no time); remove duration text column.

ALTER TABLE public.evenements
  ADD COLUMN IF NOT EXISTS event_date_start date,
  ADD COLUMN IF NOT EXISTS event_date_end date;

-- deadline_inscription: store calendar date only
ALTER TABLE public.evenements
  ALTER COLUMN deadline_inscription TYPE date USING (deadline_inscription::date);

ALTER TABLE public.evenements DROP COLUMN IF EXISTS duree;

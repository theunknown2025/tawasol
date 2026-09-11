-- Backfill missing timed events so history charts match existing click/download counters.
-- Only inserts the gap (counter - existing events); stamped at now() because prior timestamps are unknown.

DO $$
DECLARE
  r record;
  click_events bigint;
  download_events bigint;
  missing_clicks bigint;
  missing_downloads bigint;
  i integer;
BEGIN
  FOR r IN
    SELECT id, COALESCE(click_count, 0) AS click_count, COALESCE(download_count, 0) AS download_count
    FROM public.lp_library_books
  LOOP
    SELECT COUNT(*) INTO click_events
    FROM public.lp_library_book_events
    WHERE book_id = r.id AND event_type = 'click';

    SELECT COUNT(*) INTO download_events
    FROM public.lp_library_book_events
    WHERE book_id = r.id AND event_type = 'download';

    missing_clicks := GREATEST(r.click_count - click_events, 0);
    missing_downloads := GREATEST(r.download_count - download_events, 0);

    FOR i IN 1..missing_clicks LOOP
      INSERT INTO public.lp_library_book_events (book_id, event_type, created_at)
      VALUES (r.id, 'click', now());
    END LOOP;

    FOR i IN 1..missing_downloads LOOP
      INSERT INTO public.lp_library_book_events (book_id, event_type, created_at)
      VALUES (r.id, 'download', now());
    END LOOP;
  END LOOP;
END;
$$;


UPDATE public.payout_config
SET cadence_hours = 168,
    payout_hour_utc = 23,
    method = 'Binance · USDT',
    updated_at = now()
WHERE id = 1;

INSERT INTO public.payout_config (id, cadence_hours, payout_hour_utc, min_amount, method)
SELECT 1, 168, 23, 10, 'Binance · USDT'
WHERE NOT EXISTS (SELECT 1 FROM public.payout_config WHERE id = 1);

CREATE OR REPLACE FUNCTION public.get_next_payout(_user_id uuid)
 RETURNS TABLE(next_payout_at timestamp with time zone, pending_amount numeric, last_paid_at timestamp with time zone, min_amount numeric, method text, cadence_hours integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  cfg public.payout_config%ROWTYPE;
  last_run timestamptz;
  next_at timestamptz;
  pending numeric;
  base_day timestamptz;
  dow int;
  days_until_sunday int;
BEGIN
  SELECT * INTO cfg FROM public.payout_config WHERE id = 1;
  IF cfg.id IS NULL THEN
    cfg.cadence_hours := 168;
    cfg.payout_hour_utc := 23;
    cfg.min_amount := 10;
    cfg.method := 'Binance · USDT';
  END IF;

  SELECT max(ran_at) INTO last_run FROM public.payout_runs WHERE user_id = _user_id;

  IF cfg.cadence_hours = 168 THEN
    -- End of week: upcoming Sunday at payout_hour_utc
    base_day := date_trunc('day', now() AT TIME ZONE 'UTC');
    dow := EXTRACT(DOW FROM base_day)::int; -- 0 = Sunday
    days_until_sunday := (7 - dow) % 7;
    next_at := base_day + make_interval(days => days_until_sunday, hours => cfg.payout_hour_utc);
    IF next_at <= now() THEN
      next_at := next_at + interval '7 days';
    END IF;
  ELSIF cfg.cadence_hours = 24 THEN
    next_at := date_trunc('day', now() AT TIME ZONE 'UTC')
               + make_interval(hours => cfg.payout_hour_utc);
    IF next_at <= now() THEN
      next_at := next_at + interval '1 day';
    END IF;
  ELSE
    next_at := COALESCE(last_run, now()) + make_interval(hours => cfg.cadence_hours);
    IF next_at <= now() THEN
      next_at := now() + make_interval(hours => cfg.cadence_hours);
    END IF;
  END IF;

  SELECT COALESCE(sum(amount), 0) INTO pending
  FROM public.referral_earnings
  WHERE user_id = _user_id
    AND created_at > COALESCE(last_run, 'epoch'::timestamptz);

  RETURN QUERY SELECT next_at, pending, last_run, cfg.min_amount, cfg.method, cfg.cadence_hours;
END;
$function$;

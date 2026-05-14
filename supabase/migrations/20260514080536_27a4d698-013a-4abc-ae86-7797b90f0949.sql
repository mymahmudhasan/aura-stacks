
CREATE TABLE public.payout_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cadence_hours integer NOT NULL DEFAULT 24,
  payout_hour_utc smallint NOT NULL DEFAULT 0 CHECK (payout_hour_utc BETWEEN 0 AND 23),
  min_amount numeric(18,6) NOT NULL DEFAULT 10,
  method text NOT NULL DEFAULT 'Binance · USDT',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payout_config (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.payout_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read config" ON public.payout_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage config" ON public.payout_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.payout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(18,6) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'Binance · USDT',
  ran_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payout_runs_user ON public.payout_runs(user_id, ran_at DESC);

ALTER TABLE public.payout_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payouts" ON public.payout_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage payouts" ON public.payout_runs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_next_payout(_user_id uuid)
RETURNS TABLE (
  next_payout_at timestamptz,
  pending_amount numeric,
  last_paid_at timestamptz,
  min_amount numeric,
  method text,
  cadence_hours integer
)
LANGUAGE plpgsql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cfg public.payout_config%ROWTYPE;
  last_run timestamptz;
  next_at timestamptz;
  pending numeric;
BEGIN
  SELECT * INTO cfg FROM public.payout_config WHERE id = 1;
  IF cfg.id IS NULL THEN
    cfg.cadence_hours := 24;
    cfg.payout_hour_utc := 0;
    cfg.min_amount := 10;
    cfg.method := 'Binance · USDT';
  END IF;

  SELECT max(ran_at) INTO last_run FROM public.payout_runs WHERE user_id = _user_id;

  IF cfg.cadence_hours = 24 THEN
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
$$;

REVOKE EXECUTE ON FUNCTION public.get_next_payout(uuid) FROM PUBLIC, anon;

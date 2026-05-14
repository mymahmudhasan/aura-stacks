
-- Referrals table: who referred whom, for which service, at what level
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_user_id uuid,
  referred_handle text,
  service text NOT NULL CHECK (service IN ('ai-trading','mining','staking')),
  level smallint NOT NULL DEFAULT 1 CHECK (level IN (1,2)),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_service ON public.referrals(service);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Earnings ledger
CREATE TABLE public.referral_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  service text NOT NULL CHECK (service IN ('ai-trading','mining','staking')),
  level smallint NOT NULL DEFAULT 1,
  amount numeric(18,6) NOT NULL DEFAULT 0,
  description text,
  source_handle text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_earnings_user ON public.referral_earnings(user_id, created_at DESC);
CREATE INDEX idx_earnings_service ON public.referral_earnings(service);

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own earnings" ON public.referral_earnings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage earnings" ON public.referral_earnings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Aggregator function: returns per-service stats + totals for the caller
CREATE OR REPLACE FUNCTION public.get_referral_summary(_user_id uuid)
RETURNS TABLE (
  service text,
  direct_count bigint,
  network_count bigint,
  lifetime_earned numeric,
  earned_last_24h numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH svcs AS (
    SELECT unnest(ARRAY['ai-trading','mining','staking']) AS service
  )
  SELECT
    s.service,
    COALESCE((SELECT count(*) FROM referrals r WHERE r.referrer_id = _user_id AND r.service = s.service AND r.level = 1), 0) AS direct_count,
    COALESCE((SELECT count(*) FROM referrals r WHERE r.referrer_id = _user_id AND r.service = s.service AND r.level = 2), 0) AS network_count,
    COALESCE((SELECT sum(amount) FROM referral_earnings e WHERE e.user_id = _user_id AND e.service = s.service), 0) AS lifetime_earned,
    COALESCE((SELECT sum(amount) FROM referral_earnings e WHERE e.user_id = _user_id AND e.service = s.service AND e.created_at > now() - interval '24 hours'), 0) AS earned_last_24h
  FROM svcs s;
$$;

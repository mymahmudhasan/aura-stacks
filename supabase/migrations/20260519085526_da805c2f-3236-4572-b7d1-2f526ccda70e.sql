
-- offers catalog
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  badge text,
  cta_label text NOT NULL DEFAULT 'Claim',
  type text NOT NULL CHECK (type IN ('welcome_boost','vip_lock','double_rewards','referral_bonus')),
  effect jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_days integer,
  min_amount numeric,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- user offers
CREATE TABLE public.user_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_slug text NOT NULL REFERENCES public.offers(slug) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','used','pending_approval')),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  applied_to_investment_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_slug)
);
ALTER TABLE public.user_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own offers" ON public.user_offers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage user offers" ON public.user_offers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_user_offers_updated_at BEFORE UPDATE ON public.user_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_user_offers_user ON public.user_offers(user_id);

-- referral bonuses
CREATE TABLE public.referral_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid,
  referred_handle text,
  trigger_investment_id uuid,
  amount numeric NOT NULL DEFAULT 25,
  currency text NOT NULL DEFAULT 'USDT',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  admin_notes text,
  approved_by uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referral bonuses" ON public.referral_bonuses FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE POLICY "Admins manage referral bonuses" ON public.referral_bonuses FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_referral_bonuses_updated_at BEFORE UPDATE ON public.referral_bonuses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_referral_bonuses_referrer ON public.referral_bonuses(referrer_id);

-- create pending referral bonus when a referred user activates a $500+ investment for the first time
CREATE OR REPLACE FUNCTION public.handle_referral_bonus_on_investment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ref record;
  _prior int;
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') AND NEW.amount >= 500 THEN
    SELECT referrer_id INTO _ref FROM public.referrals WHERE referred_user_id = NEW.user_id LIMIT 1;
    IF _ref.referrer_id IS NOT NULL THEN
      SELECT count(*) INTO _prior FROM public.investments
        WHERE user_id = NEW.user_id AND status = 'active' AND id <> NEW.id;
      IF _prior = 0 AND NOT EXISTS (
        SELECT 1 FROM public.referral_bonuses WHERE referrer_id = _ref.referrer_id AND referred_user_id = NEW.user_id
      ) THEN
        INSERT INTO public.referral_bonuses(referrer_id, referred_user_id, trigger_investment_id, amount, status)
        VALUES (_ref.referrer_id, NEW.user_id, NEW.id, 25, 'pending');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_investments_referral_bonus
  AFTER UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_bonus_on_investment();

-- credit wallet on referral bonus approval
CREATE OR REPLACE FUNCTION public.handle_referral_bonus_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _txn_id uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.wallet_transactions(user_id, kind, status, amount, currency, method, reference_id, notes)
    VALUES (NEW.referrer_id, 'bonus', 'completed', NEW.amount, NEW.currency, 'referral_bonus', NEW.id, COALESCE(NEW.admin_notes, '$25 referral bonus approved'))
    RETURNING id INTO _txn_id;

    UPDATE public.customers SET balance = balance + NEW.amount WHERE user_id = NEW.referrer_id;

    NEW.transaction_id := _txn_id;
    NEW.paid_at := now();
    NEW.status := 'paid';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_referral_bonus_approval
  BEFORE UPDATE ON public.referral_bonuses
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_bonus_approval();

-- seed offers
INSERT INTO public.offers (slug, title, description, badge, cta_label, type, effect, duration_days, min_amount, sort_order) VALUES
  ('welcome-boost', '+3% Welcome APY Boost', 'First-time stakers get an extra 3% APY for the first 30 days on any plan. Auto-applied at first stake.', 'New investor', 'Claim boost', 'welcome_boost', '{"extra_apy_pct":3}'::jsonb, 30, NULL, 1),
  ('vip-lock', 'Lock $5,000+ → 42% APY', 'Premium tier upgrade with priority withdrawals, dedicated manager and free monthly compounding.', 'VIP · 12 month', 'Go VIP', 'vip_lock', '{"apy_pct":42,"duration_days":365}'::jsonb, 365, 5000, 2),
  ('double-rewards', 'Double Daily Rewards', 'Stake any USDT plan this week and receive 2× daily payouts for the first 14 days. Stackable with welcome boost.', 'Limited · 7 days', 'Activate offer', 'double_rewards', '{"multiplier":2}'::jsonb, 14, NULL, 3),
  ('referral-bonus', '$25 Bonus per Friend', 'Get $25 USDT credited when a referred friend stakes $500+. Unlimited referrals.', 'Refer & earn', 'Get my link', 'referral_bonus', '{"amount":25,"min_stake":500}'::jsonb, NULL, NULL, 4);

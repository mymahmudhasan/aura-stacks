
-- ENUMS
CREATE TYPE public.txn_kind AS ENUM ('deposit','withdrawal','earning','investment','refund','adjustment');
CREATE TYPE public.txn_status AS ENUM ('pending','approved','rejected','completed','failed');
CREATE TYPE public.deposit_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','rejected','paid');
CREATE TYPE public.invest_service AS ENUM ('ai_trading','mining','staking');
CREATE TYPE public.invest_status AS ENUM ('pending','active','completed','cancelled');

-- WALLET TRANSACTIONS (ledger)
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.txn_kind NOT NULL,
  status public.txn_status NOT NULL DEFAULT 'completed',
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USDT',
  method text,
  reference_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_wtx_user_created ON public.wallet_transactions(user_id, created_at DESC);

-- DEPOSITS
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USDT',
  network text,
  method text NOT NULL DEFAULT 'manual_crypto',
  tx_hash text,
  from_address text,
  screenshot_url text,
  provider_ref text,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deposits" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own deposits" ON public.deposits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins manage deposits" ON public.deposits FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_deposits_user ON public.deposits(user_id, created_at DESC);
CREATE INDEX idx_deposits_status ON public.deposits(status, created_at DESC);
CREATE TRIGGER trg_deposits_updated BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- WITHDRAWALS
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USDT',
  destination_type text NOT NULL DEFAULT 'binance_uid',
  destination text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  tx_hash text,
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage withdrawals" ON public.withdrawals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_withdrawals_user ON public.withdrawals(user_id, created_at DESC);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status, created_at DESC);
CREATE TRIGGER trg_withdrawals_updated BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INVESTMENTS
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service public.invest_service NOT NULL,
  plan_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USDT',
  status public.invest_status NOT NULL DEFAULT 'pending',
  external_provider text,
  external_ref text,
  admin_notes text,
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins manage investments" ON public.investments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_investments_user ON public.investments(user_id, created_at DESC);
CREATE INDEX idx_investments_status ON public.investments(status, created_at DESC);
CREATE TRIGGER trg_investments_updated BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INVESTMENT EARNINGS
CREATE TABLE public.investment_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  note text,
  transaction_id uuid REFERENCES public.wallet_transactions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investment_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own earnings" ON public.investment_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage earnings" ON public.investment_earnings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_inv_earnings_user ON public.investment_earnings(user_id, created_at DESC);

-- PAYMENT PROVIDERS (admin-only)
CREATE TABLE public.payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  api_key text,
  callback_secret text,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage providers" ON public.payment_providers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_providers_updated BEFORE UPDATE ON public.payment_providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add deposit addresses to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS usdt_trc20_address text,
  ADD COLUMN IF NOT EXISTS usdt_bep20_address text,
  ADD COLUMN IF NOT EXISTS usdt_erc20_address text,
  ADD COLUMN IF NOT EXISTS binance_pay_id text;

-- ============================================================
-- TRIGGER: deposit approved -> credit balance + ledger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_deposit_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _txn_id uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.wallet_transactions(user_id, kind, status, amount, currency, method, reference_id, notes)
    VALUES (NEW.user_id, 'deposit', 'completed', NEW.amount, NEW.currency, NEW.method, NEW.id, COALESCE(NEW.admin_notes, 'Deposit approved'))
    RETURNING id INTO _txn_id;

    UPDATE public.customers
      SET balance = balance + NEW.amount,
          total_deposited = total_deposited + NEW.amount
      WHERE user_id = NEW.user_id;

    NEW.transaction_id := _txn_id;
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_deposit_status BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.handle_deposit_status();

-- ============================================================
-- TRIGGER: withdrawal paid -> debit balance + ledger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_withdrawal_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _txn_id uuid; _bal numeric;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    SELECT balance INTO _bal FROM public.customers WHERE user_id = NEW.user_id;
    IF _bal IS NULL OR _bal < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient balance to pay withdrawal';
    END IF;

    INSERT INTO public.wallet_transactions(user_id, kind, status, amount, currency, method, reference_id, notes)
    VALUES (NEW.user_id, 'withdrawal', 'completed', -NEW.amount, NEW.currency, 'admin_payout', NEW.id, COALESCE(NEW.admin_notes, 'Withdrawal paid'))
    RETURNING id INTO _txn_id;

    UPDATE public.customers
      SET balance = balance - NEW.amount,
          total_withdrawn = total_withdrawn + NEW.amount
      WHERE user_id = NEW.user_id;

    NEW.transaction_id := _txn_id;
    NEW.paid_at := now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_withdrawal_status BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_status();

-- ============================================================
-- TRIGGER: investment activated -> debit balance + ledger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_investment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _txn_id uuid; _bal numeric;
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    SELECT balance INTO _bal FROM public.customers WHERE user_id = NEW.user_id;
    IF _bal IS NULL OR _bal < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient balance to activate investment';
    END IF;

    INSERT INTO public.wallet_transactions(user_id, kind, status, amount, currency, method, reference_id, notes)
    VALUES (NEW.user_id, 'investment', 'completed', -NEW.amount, NEW.currency, 'invest', NEW.id, NEW.plan_name || ' activated')
    RETURNING id INTO _txn_id;

    UPDATE public.customers SET balance = balance - NEW.amount WHERE user_id = NEW.user_id;

    NEW.transaction_id := _txn_id;
    IF NEW.started_at IS NULL THEN NEW.started_at := now(); END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_investment_status BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.handle_investment_status();

-- ============================================================
-- TRIGGER: earning inserted -> credit balance + ledger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_earning_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _txn_id uuid;
BEGIN
  INSERT INTO public.wallet_transactions(user_id, kind, status, amount, currency, method, reference_id, notes)
  VALUES (NEW.user_id, 'earning', 'completed', NEW.amount, 'USDT', 'admin', NEW.investment_id, COALESCE(NEW.note, 'Investment earning'))
  RETURNING id INTO _txn_id;

  UPDATE public.customers SET balance = balance + NEW.amount WHERE user_id = NEW.user_id;

  NEW.transaction_id := _txn_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_earning_insert BEFORE INSERT ON public.investment_earnings
  FOR EACH ROW EXECUTE FUNCTION public.handle_earning_insert();

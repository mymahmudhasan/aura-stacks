-- Welcome bonus tracking + update deposit handler to grant 25% on first deposit >= $50
CREATE TABLE IF NOT EXISTS public.welcome_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  amount numeric NOT NULL,
  source_deposit_id uuid,
  granted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own welcome bonus"
  ON public.welcome_bonuses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage welcome bonuses"
  ON public.welcome_bonuses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update deposit trigger function to grant 25% bonus on first approved deposit >= 50
CREATE OR REPLACE FUNCTION public.handle_deposit_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _txn_id uuid;
  _bonus_amount numeric;
  _prior_count int;
  _bonus_txn_id uuid;
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

    -- First-deposit 25% welcome bonus on $50+
    IF NEW.amount >= 50 THEN
      SELECT count(*) INTO _prior_count
      FROM public.deposits
      WHERE user_id = NEW.user_id
        AND status = 'approved'
        AND id <> NEW.id;

      IF _prior_count = 0 AND NOT EXISTS (
        SELECT 1 FROM public.welcome_bonuses WHERE user_id = NEW.user_id
      ) THEN
        _bonus_amount := round(NEW.amount * 0.25, 2);

        INSERT INTO public.wallet_transactions(user_id, kind, status, amount, currency, method, reference_id, notes)
        VALUES (NEW.user_id, 'bonus', 'completed', _bonus_amount, NEW.currency, 'welcome_bonus', NEW.id,
                'Welcome bonus — 25% of your first deposit of $' || NEW.amount::text)
        RETURNING id INTO _bonus_txn_id;

        UPDATE public.customers
          SET balance = balance + _bonus_amount
          WHERE user_id = NEW.user_id;

        INSERT INTO public.welcome_bonuses(user_id, amount, source_deposit_id)
        VALUES (NEW.user_id, _bonus_amount, NEW.id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
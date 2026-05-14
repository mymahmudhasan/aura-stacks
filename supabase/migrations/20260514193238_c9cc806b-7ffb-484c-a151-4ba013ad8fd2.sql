
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'demo',
  ADD COLUMN IF NOT EXISTS demo_balance numeric NOT NULL DEFAULT 10000;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_account_type_check;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_account_type_check CHECK (account_type IN ('demo','real'));

CREATE OR REPLACE FUNCTION public.upgrade_demo_on_deposit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.total_deposited > 0 AND NEW.account_type = 'demo' THEN
    NEW.account_type := 'real';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_upgrade_demo_on_deposit ON public.customers;
CREATE TRIGGER trg_upgrade_demo_on_deposit
BEFORE INSERT OR UPDATE OF total_deposited ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.upgrade_demo_on_deposit();

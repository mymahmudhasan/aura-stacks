
CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS TABLE(
  customers_total bigint,
  customers_active bigint,
  customers_pending bigint,
  customers_suspended bigint,
  total_deposited numeric,
  total_withdrawn numeric,
  total_balances numeric,
  open_tickets bigint,
  payouts_total bigint,
  paid_last_24h numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM customers),
    (SELECT count(*) FROM customers WHERE status = 'active'),
    (SELECT count(*) FROM customers WHERE status = 'pending'),
    (SELECT count(*) FROM customers WHERE status = 'suspended'),
    (SELECT COALESCE(sum(total_deposited), 0) FROM customers),
    (SELECT COALESCE(sum(total_withdrawn), 0) FROM customers),
    (SELECT COALESCE(sum(balance), 0) FROM customers),
    (SELECT count(*) FROM tickets WHERE status IN ('open','in_progress')),
    (SELECT count(*) FROM payout_runs),
    (SELECT COALESCE(sum(amount), 0) FROM payout_runs WHERE ran_at > now() - interval '24 hours')
  WHERE public.has_role(auth.uid(), 'admin'::app_role);
$$;

REVOKE ALL ON FUNCTION public.get_admin_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_overview() TO authenticated;

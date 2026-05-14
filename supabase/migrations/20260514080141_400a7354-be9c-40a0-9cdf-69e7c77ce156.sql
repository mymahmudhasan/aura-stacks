
CREATE OR REPLACE FUNCTION public.get_referral_summary(_user_id uuid)
RETURNS TABLE (
  service text,
  direct_count bigint,
  network_count bigint,
  lifetime_earned numeric,
  earned_last_24h numeric
)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path = public
AS $$
  WITH svcs AS (
    SELECT unnest(ARRAY['ai-trading','mining','staking']) AS service
  )
  SELECT
    s.service,
    COALESCE((SELECT count(*) FROM referrals r WHERE r.referrer_id = _user_id AND r.service = s.service AND r.level = 1), 0),
    COALESCE((SELECT count(*) FROM referrals r WHERE r.referrer_id = _user_id AND r.service = s.service AND r.level = 2), 0),
    COALESCE((SELECT sum(amount) FROM referral_earnings e WHERE e.user_id = _user_id AND e.service = s.service), 0),
    COALESCE((SELECT sum(amount) FROM referral_earnings e WHERE e.user_id = _user_id AND e.service = s.service AND e.created_at > now() - interval '24 hours'), 0)
  FROM svcs s;
$$;

REVOKE EXECUTE ON FUNCTION public.get_referral_summary(uuid) FROM PUBLIC, anon;

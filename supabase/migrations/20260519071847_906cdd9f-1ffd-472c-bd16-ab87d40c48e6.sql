
CREATE TABLE public.support_bot_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords text[] NOT NULL DEFAULT '{}',
  reply text NOT NULL,
  is_fallback boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_bot_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active bot replies"
  ON public.support_bot_replies FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage bot replies"
  ON public.support_bot_replies FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_support_bot_replies_updated
  BEFORE UPDATE ON public.support_bot_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.support_bot_replies (keywords, reply, is_fallback, sort_order) VALUES
  (ARRAY['hi','hello','hey','hola','salam','assalam'], 'Hi! 👋 Quick question so I can route you faster — is this about deposits/withdrawals, your AI bot, a mining/staking plan, or your account login?', false, 10),
  (ARRAY['deposit','withdraw','payout','payment','transfer'], 'Got it 👍 For deposits/withdrawals: please share your transaction hash (TXID) and the wallet/network used. Deposits credit after network confirmations (BTC ~3, ETH/BNB ~12). Withdrawals are processed within 24h after KYC review. An agent will jump in shortly to verify your case.', false, 20),
  (ARRAY['bot','ai','trading','signal','strategy'], 'Thanks! Our AI trading bot runs 24/7 with risk-controlled positions. If it looks paused, it''s usually because the market filter detected high volatility and paused entries — this is normal. Please share your account email or plan name so an agent can pull your bot logs.', false, 30),
  (ARRAY['mining','stake','staking','plan','package','roi','earn','reward'], 'Sure — mining & staking plans pay daily into your wallet balance and unlock on maturity. You can view active plans in Dashboard → Plans. Tell me which plan you''re asking about (name or amount) and an agent will confirm your exact schedule.', false, 40),
  (ARRAY['human','agent','advisor','person','representative','real'], 'Connecting you with a human advisor now 🧑‍💼 — usual response time is a few minutes. While you wait, please share the topic in 1-2 sentences so the agent can help faster.', false, 50),
  (ARRAY['kyc','verify','verification','passport','document'], 'For KYC: upload a government ID + selfie under Settings → Verification. Approvals usually take under 1 hour during business time. An agent will confirm your status here.', false, 60),
  (ARRAY['password','login','reset','2fa','otp','sign in','signin','access'], 'For login/2FA issues: try Forgot Password, and make sure your device time is correct for OTP codes. If still locked out, share your account email and an agent will assist.', false, 70),
  (ARRAY['referr','affiliate','commission','invite'], 'Affiliate rewards pay instantly when your referral funds a plan. Your referral link is on the Affiliate page. An agent can audit any missing commissions for you.', false, 80),
  (ARRAY[]::text[], 'Thanks for the details ✍️ — I''ve logged this and a human agent is being notified now. They''ll reply right in this chat within a few minutes.', true, 1000);

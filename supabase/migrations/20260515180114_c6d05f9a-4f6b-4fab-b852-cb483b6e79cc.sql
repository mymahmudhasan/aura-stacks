-- Phone OTP codes for custom Twilio-based verification
CREATE TABLE public.phone_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts smallint NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_otp_user ON public.phone_otp_codes(user_id, created_at DESC);
CREATE INDEX idx_phone_otp_phone ON public.phone_otp_codes(phone, created_at DESC);

ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;

-- No client-side access; only server functions (service role) read/write.
CREATE POLICY "Admins can view phone otp codes"
  ON public.phone_otp_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
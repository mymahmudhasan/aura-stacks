ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
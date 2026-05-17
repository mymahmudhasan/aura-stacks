ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS last_sender_address text,
  ADD COLUMN IF NOT EXISTS last_sender_network text;
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS deposit_binance_pay_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deposit_trc20_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_bep20_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_erc20_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_onchain_wallet_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS withdraw_binance_uid_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS withdraw_wallet_address_enabled boolean NOT NULL DEFAULT false;

UPDATE public.site_settings
   SET deposit_binance_pay_enabled = true,
       deposit_trc20_enabled = false,
       deposit_bep20_enabled = false,
       deposit_erc20_enabled = false,
       deposit_onchain_wallet_enabled = false,
       withdraw_binance_uid_enabled = true,
       withdraw_wallet_address_enabled = false
 WHERE id = 1;
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS live_chat_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT true;
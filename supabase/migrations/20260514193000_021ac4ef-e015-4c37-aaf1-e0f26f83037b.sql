CREATE TABLE public.site_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  whatsapp_number text NOT NULL DEFAULT '14155551234',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (id, whatsapp_number) VALUES (1, '14155551234')
  ON CONFLICT (id) DO NOTHING;
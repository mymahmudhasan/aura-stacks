-- Extend new-user handler to also create a customers row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
BEGIN
  _name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email,''), '@', 1),
    ''
  );

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, _name, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.customers (user_id, full_name, email, status, account_type)
  VALUES (NEW.id, _name, COALESCE(NEW.email, ''), 'active', 'demo')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Back-fill missing customer rows for existing auth users
INSERT INTO public.customers (user_id, full_name, email, status, account_type)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email,''),'@',1), ''),
  COALESCE(u.email, ''),
  'active',
  'demo'
FROM auth.users u
LEFT JOIN public.customers c ON c.user_id = u.id
WHERE c.id IS NULL;

-- Trigger function to sync auth.users to public.users and assign a default agency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_agency_id UUID;
BEGIN
  -- Find or create a default agency
  SELECT id INTO default_agency_id FROM public.agencies LIMIT 1;
  
  IF default_agency_id IS NULL THEN
    default_agency_id := gen_random_uuid();
    INSERT INTO public.agencies (id, name)
    VALUES (default_agency_id, 'Minha Agência Padrão');
  END IF;

  -- Insert user into public.users
  INSERT INTO public.users (id, role, full_name, email, agency_id)
  VALUES (
    new.id,
    'admin', -- default role for signups
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    default_agency_id
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
    agency_id = COALESCE(users.agency_id, EXCLUDED.agency_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to execute the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill all existing users in auth.users that are not in public.users
DO $$
DECLARE
  auth_user RECORD;
  default_agency_id UUID;
BEGIN
  -- Find or create a default agency
  SELECT id INTO default_agency_id FROM public.agencies LIMIT 1;
  
  IF default_agency_id IS NULL THEN
    default_agency_id := gen_random_uuid();
    INSERT INTO public.agencies (id, name)
    VALUES (default_agency_id, 'Minha Agência Padrão');
  END IF;

  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    INSERT INTO public.users (id, role, full_name, email, agency_id)
    VALUES (
      auth_user.id,
      'admin',
      COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
      auth_user.email,
      default_agency_id
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

/*
  # Fix handle_new_user trigger to prevent signup failures

  1. Changes
    - Update handle_new_user function to use INSERT ... ON CONFLICT DO NOTHING
    - This prevents the trigger from failing if a profile already exists
    - Ensures user signup succeeds even if profile creation has issues

  2. Why this is needed
    - The previous version would fail the entire user creation if profile insert failed
    - This caused "Database error saving new user" errors
    - The new version gracefully handles duplicate profiles
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
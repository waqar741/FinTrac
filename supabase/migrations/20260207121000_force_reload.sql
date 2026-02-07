/*
  # Force Reload Schema and Grant Permissions

  1. Reload PostgREST schema cache.
  2. Grant usage on schema public.
  3. Grant all on accounts table.
*/

NOTIFY pgrst, 'reload schema';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE accounts TO anon, authenticated;

-- Force a dummy update then delete to perhaps trigger a cache invalidation if notify fails (unlikely)
-- DO $$ 
-- BEGIN 
--   -- Just a no-op 
-- END $$;

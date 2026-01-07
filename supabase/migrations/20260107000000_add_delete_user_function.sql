-- Create a more robust delete_user function that handles cascading deletes
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  -- 1. Delete data from dependent tables first 
  -- (This prevents foreign key constraint errors if ON DELETE CASCADE is not set)
  
  -- Delete transactions first (they reference accounts)
  DELETE FROM public.transactions WHERE user_id = current_user_id;
  
  -- Delete accounts
  DELETE FROM public.accounts WHERE user_id = current_user_id;
  
  -- Delete other independent user data
  DELETE FROM public.goals WHERE user_id = current_user_id;
  DELETE FROM public.group_expenses WHERE user_id = current_user_id;
  DELETE FROM public.debts_credits WHERE user_id = current_user_id;
  DELETE FROM public.notifications WHERE user_id = current_user_id;
  
  -- Delete profile (usually references auth.users)
  DELETE FROM public.profiles WHERE id = current_user_id;

  -- 2. Finally delete the user from auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;

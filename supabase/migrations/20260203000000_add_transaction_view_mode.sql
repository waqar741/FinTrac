-- Add transaction_view_mode column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS transaction_view_mode TEXT DEFAULT 'list';

-- Add a check constraint to ensure only valid values
ALTER TABLE profiles 
ADD CONSTRAINT valid_transaction_view_mode 
CHECK (transaction_view_mode IN ('list', 'calendar'));

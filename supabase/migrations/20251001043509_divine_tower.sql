/*
  # Complete Budget to Account System Migration

  1. Remove Budget System
    - Drop budgets table and related constraints
    - Remove budget-related foreign keys from transactions

  2. Create Account System
    - Create accounts table for money sources
    - Create transfers table for account-to-account movements
    - Update transactions to link to accounts instead of budgets

  3. Security
    - Enable RLS on all new tables
    - Add policies for user data isolation

  4. Data Integrity
    - Add proper constraints and indexes
    - Ensure referential integrity
*/

-- Drop existing budget-related tables and constraints
DROP TABLE IF EXISTS savings_goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'cash', 'wallet', 'credit_card', 'investment', 'savings', 'other')),
  balance numeric DEFAULT 0,
  currency text DEFAULT 'INR',
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create transfers table for account-to-account movements
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Update transactions table to use accounts instead of budgets
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_budget_id_fkey;
ALTER TABLE transactions DROP COLUMN IF EXISTS budget_id;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;

-- Update debts_credits to reference accounts for settlements
ALTER TABLE debts_credits ADD COLUMN IF NOT EXISTS settlement_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS accounts_type_idx ON accounts(type);
CREATE INDEX IF NOT EXISTS transfers_user_id_idx ON transfers(user_id);
CREATE INDEX IF NOT EXISTS transfers_from_account_idx ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS transfers_to_account_idx ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON transactions(account_id);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can read own accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for transfers
CREATE POLICY "Users can read own transfers"
  ON transfers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transfers"
  ON transfers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transfers"
  ON transfers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transfers"
  ON transfers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
/*
  # Add Group Expense Splitting and Savings Goals Tables

  1. New Tables
    - `groups` - For expense splitting groups
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `invite_code` (text, unique)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
    
    - `group_members` - Group membership
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to groups)
      - `user_id` (uuid, foreign key to users)
      - `joined_at` (timestamp)
    
    - `group_expenses` - Shared expenses
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to groups)
      - `paid_by` (uuid, foreign key to users)
      - `amount` (numeric)
      - `description` (text)
      - `category` (text)
      - `created_at` (timestamp)
    
    - `expense_splits` - How expenses are split
      - `id` (uuid, primary key)
      - `expense_id` (uuid, foreign key to group_expenses)
      - `user_id` (uuid, foreign key to users)
      - `amount` (numeric)
    
    - `savings_goals` - User savings goals
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `budget_id` (uuid, foreign key to budgets)
      - `name` (text)
      - `target_amount` (numeric)
      - `current_amount` (numeric, default 0)
      - `deadline` (date, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access

  3. Changes
    - Add default due_date to debts_credits (7 days from creation)
    - Add settlement_transaction_id to track settlement transactions
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_expenses table
CREATE TABLE IF NOT EXISTS group_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  UNIQUE(expense_id, user_id)
);

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  deadline date,
  created_at timestamptz DEFAULT now()
);

-- Update debts_credits table to add settlement tracking and default due date
DO $$
BEGIN
  -- Add settlement_transaction_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts_credits' AND column_name = 'settlement_transaction_id'
  ) THEN
    ALTER TABLE debts_credits ADD COLUMN settlement_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL;
  END IF;

  -- Update due_date to have default of 7 days from now if it doesn't already have a default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts_credits' AND column_name = 'due_date' AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE debts_credits ALTER COLUMN due_date SET DEFAULT (now() + interval '7 days');
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can read groups they are members of"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) OR created_by = auth.uid()
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for group_members
CREATE POLICY "Users can read group memberships for their groups"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for group_expenses
CREATE POLICY "Group members can read group expenses"
  ON group_expenses
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON group_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    paid_by = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update their expenses"
  ON group_expenses
  FOR UPDATE
  TO authenticated
  USING (paid_by = auth.uid())
  WITH CHECK (paid_by = auth.uid());

CREATE POLICY "Expense creators can delete their expenses"
  ON group_expenses
  FOR DELETE
  TO authenticated
  USING (paid_by = auth.uid());

-- RLS Policies for expense_splits
CREATE POLICY "Group members can read expense splits"
  ON expense_splits
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM group_expenses
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can manage expense splits"
  ON expense_splits
  FOR ALL
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM group_expenses
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for savings_goals
CREATE POLICY "Users can read own savings goals"
  ON savings_goals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own savings goals"
  ON savings_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own savings goals"
  ON savings_goals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS groups_invite_code_idx ON groups (invite_code);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members (user_id);
CREATE INDEX IF NOT EXISTS group_expenses_group_id_idx ON group_expenses (group_id);
CREATE INDEX IF NOT EXISTS group_expenses_paid_by_idx ON group_expenses (paid_by);
CREATE INDEX IF NOT EXISTS expense_splits_expense_id_idx ON expense_splits (expense_id);
CREATE INDEX IF NOT EXISTS expense_splits_user_id_idx ON expense_splits (user_id);
CREATE INDEX IF NOT EXISTS savings_goals_user_id_idx ON savings_goals (user_id);
CREATE INDEX IF NOT EXISTS savings_goals_budget_id_idx ON savings_goals (budget_id);
CREATE INDEX IF NOT EXISTS debts_credits_settlement_transaction_id_idx ON debts_credits (settlement_transaction_id);
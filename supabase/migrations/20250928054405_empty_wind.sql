/*
  # Create debts_credits table

  1. New Tables
    - `debts_credits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `person_name` (text, name of the person)
      - `amount` (numeric, amount owed/credited)
      - `type` (text, either 'debt' or 'credit')
      - `description` (text, description of the debt/credit)
      - `due_date` (date, optional due date)
      - `is_settled` (boolean, whether it's been paid/received)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `debts_credits` table
    - Add policies for authenticated users to manage their own debts/credits
*/

CREATE TABLE IF NOT EXISTS debts_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  person_name text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('debt', 'credit')),
  description text NOT NULL,
  due_date date,
  is_settled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS debts_credits_user_id_idx ON debts_credits(user_id);
CREATE INDEX IF NOT EXISTS debts_credits_created_at_idx ON debts_credits(created_at);
CREATE INDEX IF NOT EXISTS debts_credits_type_idx ON debts_credits(type);
CREATE INDEX IF NOT EXISTS debts_credits_is_settled_idx ON debts_credits(is_settled);

-- Enable Row Level Security
ALTER TABLE debts_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own debts/credits"
  ON debts_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts/credits"
  ON debts_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts/credits"
  ON debts_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts/credits"
  ON debts_credits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
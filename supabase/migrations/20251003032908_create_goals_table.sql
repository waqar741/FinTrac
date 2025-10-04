/*
  # Create goals table

  1. New Tables
    - `goals`
      - `id` (uuid, primary key) - Unique identifier for each goal
      - `user_id` (uuid, foreign key) - References auth.users
      - `name` (text) - Name/title of the goal
      - `target_amount` (numeric) - Target amount to achieve
      - `current_amount` (numeric) - Current progress amount, defaults to 0
      - `deadline` (timestamptz, optional) - Target completion date
      - `color` (text) - Color code for UI display, defaults to blue
      - `is_active` (boolean) - Soft delete flag, defaults to true
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `goals` table
    - Add policy for users to read their own goals
    - Add policy for users to create their own goals
    - Add policy for users to update their own goals
    - Add policy for users to delete (soft delete) their own goals

  3. Indexes
    - Index on user_id for faster queries
    - Index on is_active for filtering active goals
*/

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  deadline timestamptz,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_is_active ON goals(is_active);
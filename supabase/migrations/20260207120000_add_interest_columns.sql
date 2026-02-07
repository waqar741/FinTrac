/*
  # Add Interest Columns to Accounts Table

  1. New Columns
    - `interest_rate` (numeric, nullable)
    - `interest_frequency` (text, nullable)

  2. Why
    - Enable storing interest details for savings/investment accounts.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'interest_rate'
  ) THEN
    ALTER TABLE accounts ADD COLUMN interest_rate numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'interest_frequency'
  ) THEN
    ALTER TABLE accounts ADD COLUMN interest_frequency text;
  END IF;
END $$;

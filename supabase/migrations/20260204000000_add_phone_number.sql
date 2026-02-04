-- Add phone_number column to debts_credits table (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts_credits') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'debts_credits' AND column_name = 'phone_number') THEN
      ALTER TABLE debts_credits ADD COLUMN phone_number TEXT DEFAULT NULL;
      COMMENT ON COLUMN debts_credits.phone_number IS 'Phone number for WhatsApp sharing';
    END IF;
  END IF;
END $$;

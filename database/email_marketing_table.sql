-- Email Marketing List Table
-- Copy and paste this entire file into Supabase SQL Editor and click "Run"

CREATE TABLE IF NOT EXISTS email_marketing_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_email_marketing_list_email 
ON email_marketing_list(email);

-- Enable Row Level Security
ALTER TABLE email_marketing_list ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations" ON email_marketing_list;
CREATE POLICY "Allow all operations" ON email_marketing_list
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Success message
SELECT 'email_marketing_list table created successfully!' as message;


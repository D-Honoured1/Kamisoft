-- Create admin_users table for database authentication
-- Run this SQL in your Supabase SQL Editor or database management tool

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- In production, hash this with bcrypt
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Add RLS policies (optional, but recommended)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated admins to read their own data
CREATE POLICY "Admins can view their own data" 
ON admin_users FOR SELECT 
USING (auth.uid()::text = id::text);

-- Insert a sample admin user (change these credentials!)
-- Note: In production, hash the password using bcrypt
INSERT INTO admin_users (name, email, password, role) 
VALUES 
  ('Admin User', 'danielausten@kamisoftenterprises.online', 'Kami_Unrivalled', 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();
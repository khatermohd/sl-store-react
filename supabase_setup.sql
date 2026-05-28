-- SQL script to initialize the orders table in your Supabase database.
-- Execute this script in the SQL Editor in your Supabase Dashboard:
-- https://supabase.com -> Click on your project -> Go to SQL Editor -> Paste & Run.

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  delivery_method TEXT,
  items_total NUMERIC,
  shipping_fee NUMERIC,
  grand_total NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TEXT,
  items JSONB,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Create policy to allow anyone to read orders (so customers can track their invoices)
CREATE POLICY "Allow public read access" ON orders
  FOR SELECT USING (true);

-- 2. Create policy to allow anyone to insert orders (so customers can submit new orders)
CREATE POLICY "Allow public insert access" ON orders
  FOR INSERT WITH CHECK (true);

-- 3. Create policy to allow anyone to update orders (for admin status modifications & customer updates)
CREATE POLICY "Allow public update access" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Create policy to allow anyone to delete orders (for admin clear/cancel features)
CREATE POLICY "Allow public delete access" ON orders
  FOR DELETE USING (true);

-- BizBook: Supabase Database Schema
-- Migrating from Firebase Firestore to PostgreSQL

-- APP_USERS table (using app_users to avoid conflict with auth.users)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'User'
);

-- CLIENTS table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  ifu TEXT,
  rccm TEXT,
  tax_regime TEXT,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Active'
);

-- SUPPLIERS table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCTS table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reference TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  safety_stock INTEGER NOT NULL DEFAULT 0
);

-- QUOTES table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  sub_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  retenue NUMERIC(5,2) NOT NULL DEFAULT 0,
  retenue_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_a_payer NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft'
);

-- INVOICES table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  sub_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  retenue NUMERIC(5,2) NOT NULL DEFAULT 0,
  retenue_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_a_payer NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payments JSONB NOT NULL DEFAULT '[]'
);

-- PURCHASES table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  transport_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_fees NUMERIC(12,2) NOT NULL DEFAULT 0,
  premier_versement NUMERIC(12,2) NOT NULL DEFAULT 0,
  deuxieme_versement NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending'
);

-- EXPENSES table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL
);

-- CLIENT_ORDERS table
CREATE TABLE IF NOT EXISTS client_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending'
);

-- SETTINGS table (single row config)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  company_name TEXT NOT NULL DEFAULT 'BizBook Inc.',
  legal_name TEXT NOT NULL DEFAULT 'BizBook Incorporated',
  manager_name TEXT NOT NULL DEFAULT 'Nom du Gerant',
  company_address TEXT NOT NULL DEFAULT 'Votre adresse complete',
  company_phone TEXT NOT NULL DEFAULT 'Votre numero de telephone',
  company_ifu TEXT NOT NULL DEFAULT 'Votre numero IFU',
  company_rccm TEXT NOT NULL DEFAULT 'Votre numero RCCM',
  currency TEXT NOT NULL DEFAULT 'XOF',
  logo_url TEXT,
  invoice_number_format TEXT NOT NULL DEFAULT 'PREFIX-YEAR-NUM',
  invoice_template TEXT NOT NULL DEFAULT 'detailed'
);

-- Insert default settings row
INSERT INTO settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_reg_date ON clients(registration_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_number ON purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_client_orders_date ON client_orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

import { createAdminClient } from '@/lib/supabase/admin';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase, ClientOrder } from './types';

const DB_UNAVAILABLE_ERROR = "La connexion a la base de donnees a echoue. Veuillez verifier la configuration de Supabase.";

// ---- camelCase <-> snake_case mapping helpers ----

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapKeysToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    result[toSnakeCase(key)] = obj[key];
  }
  return result;
}

function mapKeysToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    result[toCamelCase(key)] = obj[key];
  }
  return result;
}

function rowToEntity<T>(row: Record<string, any>): T {
  return mapKeysToCamel(row) as T;
}

function rowsToEntities<T>(rows: Record<string, any>[]): T[] {
  return rows.map(row => rowToEntity<T>(row));
}

// ---- CLIENTS ----

export async function getClients(orgId: string): Promise<Client[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', orgId)
    .order('registration_date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Client>(data || []);
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(DB_UNAVAILABLE_ERROR);
  }
  return data ? rowToEntity<Client>(data) : null;
}

export async function addClient(clientData: Omit<Client, 'id' | 'registrationDate' | 'status'>, orgId: string): Promise<Client> {
  const supabase = createAdminClient();
  const insertData = {
    ...mapKeysToSnake(clientData),
    registration_date: new Date().toISOString(),
    status: 'Active',
    organization_id: orgId,
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Client>(data);
}

export async function updateClient(id: string, clientData: Partial<Omit<Client, 'id' | 'registrationDate'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('clients')
    .update(mapKeysToSnake(clientData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- SUPPLIERS ----

export async function getSuppliers(orgId: string): Promise<Supplier[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', orgId)
    .order('registration_date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Supplier>(data || []);
}

export async function addSupplier(supplierData: Omit<Supplier, 'id' | 'registrationDate'>, orgId: string): Promise<Supplier> {
  const supabase = createAdminClient();
  const insertData = {
    ...mapKeysToSnake(supplierData),
    registration_date: new Date().toISOString(),
    organization_id: orgId,
  };

  const { data, error } = await supabase
    .from('suppliers')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Supplier>(data);
}

export async function updateSupplier(id: string, supplierData: Partial<Omit<Supplier, 'id' | 'registrationDate'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('suppliers')
    .update(mapKeysToSnake(supplierData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- PRODUCTS ----

export async function getProducts(orgId: string): Promise<Product[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Product>(data || []);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(DB_UNAVAILABLE_ERROR);
  }
  return data ? rowToEntity<Product>(data) : null;
}

export async function addProduct(productData: Omit<Product, 'id'>, orgId: string): Promise<Product> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('products')
    .insert({ ...mapKeysToSnake(productData), organization_id: orgId })
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Product>(data);
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('products')
    .update(mapKeysToSnake(productData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- QUOTES ----

export async function getQuotes(orgId: string): Promise<Quote[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Quote>(data || []);
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(DB_UNAVAILABLE_ERROR);
  }
  return data ? rowToEntity<Quote>(data) : null;
}

export async function addQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber'>, orgId: string): Promise<Quote> {
  const supabase = createAdminClient();

  const currentYear = new Date().getFullYear();
  const prefix = `PRO${currentYear}-`;

  const { data: latestQuotes } = await supabase
    .from('quotes')
    .select('quote_number')
    .eq('organization_id', orgId)
    .gte('quote_number', prefix)
    .lt('quote_number', `PRO${currentYear + 1}-`)
    .order('quote_number', { ascending: false })
    .limit(1);

  let latestNumber = 0;
  if (latestQuotes && latestQuotes.length > 0) {
    const numberPart = latestQuotes[0].quote_number.split('-')[1];
    if (numberPart) {
      latestNumber = parseInt(numberPart, 10);
    }
  }

  const newQuoteNumber = `${prefix}${(latestNumber + 1).toString().padStart(3, '0')}`;

  const insertData = {
    ...mapKeysToSnake(quoteData),
    quote_number: newQuoteNumber,
    organization_id: orgId,
  };

  const { data, error } = await supabase
    .from('quotes')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Quote>(data);
}

export async function updateQuote(id: string, quoteData: Partial<Omit<Quote, 'id'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('quotes')
    .update(mapKeysToSnake(quoteData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- INVOICES ----

export async function getInvoices(orgId: string): Promise<Invoice[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Invoice>(data || []);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(DB_UNAVAILABLE_ERROR);
  }
  return data ? rowToEntity<Invoice>(data) : null;
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>, orgId: string): Promise<Invoice> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('invoices')
    .insert({ ...mapKeysToSnake(invoiceData), organization_id: orgId })
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Invoice>(data);
}

export async function getNextInvoiceNumber(orgId: string): Promise<string> {
  const supabase = createAdminClient();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `FACT-${currentYear}-`;

  const { data: latestInvoices } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('organization_id', orgId)
    .gte('invoice_number', yearPrefix)
    .lt('invoice_number', `FACT-${currentYear + 1}-`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  let newInvoiceSuffix = 1;
  if (latestInvoices && latestInvoices.length > 0) {
    const lastSuffix = parseInt(latestInvoices[0].invoice_number.replace(yearPrefix, ''), 10);
    if (!isNaN(lastSuffix)) {
      newInvoiceSuffix = lastSuffix + 1;
    }
  }

  return `${yearPrefix}${newInvoiceSuffix.toString().padStart(4, '0')}`;
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('invoices')
    .update(mapKeysToSnake(invoiceData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- PURCHASES ----

export async function getPurchases(orgId: string): Promise<Purchase[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Purchase>(data || []);
}

export async function getPurchaseById(id: string): Promise<Purchase | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(DB_UNAVAILABLE_ERROR);
  }
  return data ? rowToEntity<Purchase>(data) : null;
}

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseNumber'>, orgId: string): Promise<Purchase> {
  const supabase = createAdminClient();

  const currentYear = new Date().getFullYear();
  const prefix = `ACH${currentYear}-`;

  const { data: latestPurchases } = await supabase
    .from('purchases')
    .select('purchase_number')
    .eq('organization_id', orgId)
    .gte('purchase_number', prefix)
    .lt('purchase_number', `ACH${currentYear + 1}-`)
    .order('purchase_number', { ascending: false })
    .limit(1);

  let latestPurchaseNumber = 0;
  if (latestPurchases && latestPurchases.length > 0) {
    const num = latestPurchases[0].purchase_number;
    if (num && num.includes('-')) {
      latestPurchaseNumber = parseInt(num.split('-')[1], 10);
    }
  }

  const newPurchaseNumber = `${prefix}${(latestPurchaseNumber + 1).toString().padStart(3, '0')}`;

  const insertData = {
    ...mapKeysToSnake(purchaseData),
    purchase_number: newPurchaseNumber,
    organization_id: orgId,
  };

  const { data, error } = await supabase
    .from('purchases')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Purchase>(data);
}

export async function updatePurchase(id: string, purchaseData: Partial<Omit<Purchase, 'id'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('purchases')
    .update(mapKeysToSnake(purchaseData))
    .eq('id', id);

  if (error) throw error;
}

// ---- EXPENSES ----

export async function getExpenses(orgId: string): Promise<Expense[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<Expense>(data || []);
}

export async function addExpense(expenseData: Omit<Expense, 'id'>, orgId: string): Promise<Expense> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...mapKeysToSnake(expenseData), organization_id: orgId })
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Expense>(data);
}

export async function updateExpense(id: string, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('expenses')
    .update(mapKeysToSnake(expenseData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- CLIENT ORDERS ----

export async function getClientOrders(orgId: string): Promise<ClientOrder[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('client_orders')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) throw new Error(DB_UNAVAILABLE_ERROR);
  return rowsToEntities<ClientOrder>(data || []);
}

export async function getClientOrderById(id: string): Promise<ClientOrder | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('client_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(DB_UNAVAILABLE_ERROR);
  }
  return data ? rowToEntity<ClientOrder>(data) : null;
}

export async function updateClientOrder(id: string, data: Partial<Omit<ClientOrder, 'id'>>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('client_orders')
    .update(mapKeysToSnake(data))
    .eq('id', id);

  if (error) throw error;
}

// ---- SETTINGS ----

const defaultSettings: Settings = {
  companyName: 'BizBook Inc.',
  legalName: 'BizBook Incorporated',
  managerName: 'Nom du Gerant',
  companyAddress: 'Votre adresse complete',
  companyPhone: 'Votre numero de telephone',
  companyIfu: 'Votre numero IFU',
  companyRccm: 'Votre numero RCCM',
  currency: 'XOF',
  logoUrl: null,
  invoiceNumberFormat: 'PREFIX-YEAR-NUM',
  invoiceTemplate: 'detailed',
};

export async function getSettings(orgId: string): Promise<Settings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (error || !data) {
    // Insert default settings for this org if none exist
    const { data: insertedData, error: insertError } = await supabase
      .from('settings')
      .upsert({ id: `settings_${orgId}`, organization_id: orgId, ...mapKeysToSnake(defaultSettings) })
      .select()
      .single();

    if (insertError || !insertedData) return defaultSettings;
    return { ...defaultSettings, ...rowToEntity<Settings>(insertedData) };
  }

  return { ...defaultSettings, ...rowToEntity<Settings>(data) };
}

export async function updateSettings(settingsData: Partial<Settings>, orgId: string): Promise<Settings> {
  const supabase = createAdminClient();
  const currentSettings = await getSettings(orgId);
  const newSettings = { ...currentSettings, ...settingsData };

  const { error } = await supabase
    .from('settings')
    .upsert({ id: `settings_${orgId}`, organization_id: orgId, ...mapKeysToSnake(newSettings) });

  if (error) throw error;
  return newSettings;
}

// ---- DASHBOARD STATS ----

export async function getDashboardStats(orgId: string) {
  const supabase = createAdminClient();

  const now = new Date();
  const currentYear = now.getFullYear();
  let fiscalYearStartDate: Date;

  if (now.getMonth() < 11 || (now.getMonth() === 11 && now.getDate() < 25)) {
    fiscalYearStartDate = new Date(currentYear - 1, 11, 25, 0, 0, 0, 0);
  } else {
    fiscalYearStartDate = new Date(currentYear, 11, 25, 0, 0, 0, 0);
  }

  const fiscalStartDateIso = fiscalYearStartDate.toISOString();

  const [
    invoicesFiscalResult,
    unpaidInvoicesResult,
    expensesFiscalResult,
    totalClientsResult,
    activeClientsResult,
    totalProductsResult,
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('total_amount, status')
      .eq('organization_id', orgId)
      .gte('date', fiscalStartDateIso),
    supabase
      .from('invoices')
      .select('total_amount, amount_paid, status')
      .eq('organization_id', orgId)
      .in('status', ['Unpaid', 'Partially Paid']),
    supabase
      .from('expenses')
      .select('amount')
      .eq('organization_id', orgId)
      .gte('date', fiscalStartDateIso),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'Active'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  let totalRevenue = 0;
  if (invoicesFiscalResult.data) {
    for (const inv of invoicesFiscalResult.data) {
      if (inv.status !== 'Cancelled') {
        totalRevenue += Number(inv.total_amount) || 0;
      }
    }
  }

  let totalDue = 0;
  let unpaidInvoicesCount = 0;
  if (unpaidInvoicesResult.data) {
    for (const inv of unpaidInvoicesResult.data) {
      if (inv.status !== 'Cancelled') {
        const due = (Number(inv.total_amount) || 0) - (Number(inv.amount_paid) || 0);
        if (due > 0) {
          totalDue += due;
          unpaidInvoicesCount++;
        }
      }
    }
  }

  let totalExpenses = 0;
  if (expensesFiscalResult.data) {
    for (const exp of expensesFiscalResult.data) {
      totalExpenses += Number(exp.amount) || 0;
    }
  }

  return {
    totalRevenue,
    totalDue,
    unpaidInvoicesCount,
    totalExpenses,
    totalClients: totalClientsResult.count ?? 0,
    activeClients: activeClientsResult.count ?? 0,
    productCount: totalProductsResult.count ?? 0,
  };
}

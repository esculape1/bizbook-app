
import { createClient } from '@/lib/supabase/server';
import type { Client, Product, Invoice, Expense, Settings, Quote, Supplier, Purchase, User, UserWithPassword, ClientOrder } from './types';
import { unstable_cache as cache } from 'next/cache';

const DB_UNAVAILABLE_ERROR = "La connexion à la base de données a échoué. Veuillez vérifier la configuration de Supabase.";
const REVALIDATION_TIME = 3600; // 1 heure en secondes

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

// ---- USERS ----

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    return data ? rowToEntity<UserWithPassword>(data) : null;
  } catch (error) {
    console.error(`Impossible de récupérer l'utilisateur avec l'email ${email}:`, error);
    throw error;
  }
}

export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('app_users')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (error) throw error;
}

// ---- CLIENTS ----

export const getClients = cache(
  async (): Promise<Client[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('registration_date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Client>(data || []);
  },
  ['clients'],
  { revalidate: REVALIDATION_TIME, tags: ['clients'] }
);

export const getClientById = cache(
  async (id: string): Promise<Client | null> => {
    const supabase = createClient();
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
  },
  ['client'],
  { revalidate: REVALIDATION_TIME, tags: ['clients'] }
);

export async function addClient(clientData: Omit<Client, 'id' | 'registrationDate' | 'status'>): Promise<Client> {
  const supabase = createClient();
  const insertData = {
    ...mapKeysToSnake(clientData),
    registration_date: new Date().toISOString(),
    status: 'Active',
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
  const supabase = createClient();
  const { error } = await supabase
    .from('clients')
    .update(mapKeysToSnake(clientData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- SUPPLIERS ----

export const getSuppliers = cache(
  async (): Promise<Supplier[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('registration_date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Supplier>(data || []);
  },
  ['suppliers'],
  { revalidate: REVALIDATION_TIME, tags: ['suppliers'] }
);

export async function addSupplier(supplierData: Omit<Supplier, 'id' | 'registrationDate'>): Promise<Supplier> {
  const supabase = createClient();
  const insertData = {
    ...mapKeysToSnake(supplierData),
    registration_date: new Date().toISOString(),
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
  const supabase = createClient();
  const { error } = await supabase
    .from('suppliers')
    .update(mapKeysToSnake(supplierData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- PRODUCTS ----

export const getProducts = cache(
  async (): Promise<Product[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Product>(data || []);
  },
  ['products'],
  { revalidate: REVALIDATION_TIME, tags: ['products'] }
);

export async function addProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .insert(mapKeysToSnake(productData))
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Product>(data);
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('products')
    .update(mapKeysToSnake(productData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- QUOTES ----

export const getQuotes = cache(
  async (): Promise<Quote[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Quote>(data || []);
  },
  ['quotes'],
  { revalidate: REVALIDATION_TIME, tags: ['quotes'] }
);

export const getQuoteById = cache(
  async (id: string): Promise<Quote | null> => {
    const supabase = createClient();
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
  },
  ['quote'],
  { revalidate: REVALIDATION_TIME, tags: ['quotes'] }
);

export async function addQuote(quoteData: Omit<Quote, 'id' | 'quoteNumber'>): Promise<Quote> {
  const supabase = createClient();

  const currentYear = new Date().getFullYear();
  const prefix = `PRO${currentYear}-`;

  // Get the latest quote number for this year
  const { data: latestQuotes } = await supabase
    .from('quotes')
    .select('quote_number')
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
  const supabase = createClient();
  const { error } = await supabase
    .from('quotes')
    .update(mapKeysToSnake(quoteData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteQuote(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- INVOICES ----

export const getInvoices = cache(
  async (): Promise<Invoice[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Invoice>(data || []);
  },
  ['invoices'],
  { revalidate: REVALIDATION_TIME, tags: ['invoices'] }
);

export const getInvoiceById = cache(
  async (id: string): Promise<Invoice | null> => {
    const supabase = createClient();
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
  },
  ['invoice'],
  { revalidate: REVALIDATION_TIME, tags: ['invoices'] }
);

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .insert(mapKeysToSnake(invoiceData))
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Invoice>(data);
}

/**
 * Get the next sequential invoice number for the year.
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = createClient();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `FACT-${currentYear}-`;

  const { data: latestInvoices } = await supabase
    .from('invoices')
    .select('invoice_number')
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
  const supabase = createClient();
  const { error } = await supabase
    .from('invoices')
    .update(mapKeysToSnake(invoiceData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- PURCHASES ----

export const getPurchases = cache(
  async (): Promise<Purchase[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Purchase>(data || []);
  },
  ['purchases'],
  { revalidate: REVALIDATION_TIME, tags: ['purchases'] }
);

export const getPurchaseById = cache(
  async (id: string): Promise<Purchase | null> => {
    const supabase = createClient();
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
  },
  ['purchase'],
  { revalidate: REVALIDATION_TIME, tags: ['purchases'] }
);

export async function addPurchase(purchaseData: Omit<Purchase, 'id' | 'purchaseNumber'>): Promise<Purchase> {
  const supabase = createClient();

  const currentYear = new Date().getFullYear();
  const prefix = `ACH${currentYear}-`;

  const { data: latestPurchases } = await supabase
    .from('purchases')
    .select('purchase_number')
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
  const supabase = createClient();
  const { error } = await supabase
    .from('purchases')
    .update(mapKeysToSnake(purchaseData))
    .eq('id', id);

  if (error) throw error;
}

// ---- EXPENSES ----

export const getExpenses = cache(
  async (): Promise<Expense[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<Expense>(data || []);
  },
  ['expenses'],
  { revalidate: REVALIDATION_TIME, tags: ['expenses'] }
);

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert(mapKeysToSnake(expenseData))
    .select()
    .single();

  if (error) throw error;
  return rowToEntity<Expense>(data);
}

export async function updateExpense(id: string, expenseData: Partial<Omit<Expense, 'id'>>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('expenses')
    .update(mapKeysToSnake(expenseData))
    .eq('id', id);

  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---- CLIENT ORDERS ----

export const getClientOrders = cache(
  async (): Promise<ClientOrder[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('client_orders')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(DB_UNAVAILABLE_ERROR);
    return rowsToEntities<ClientOrder>(data || []);
  },
  ['client-orders'],
  { revalidate: REVALIDATION_TIME, tags: ['client-orders'] }
);

export const getClientOrderById = cache(
  async (id: string): Promise<ClientOrder | null> => {
    const supabase = createClient();
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
  },
  ['client-order'],
  { revalidate: REVALIDATION_TIME, tags: ['client-orders'] }
);

export async function updateClientOrder(id: string, data: Partial<Omit<ClientOrder, 'id'>>): Promise<void> {
  const supabase = createClient();
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
  managerName: 'Nom du Gérant',
  companyAddress: 'Votre adresse complète',
  companyPhone: 'Votre numéro de téléphone',
  companyIfu: 'Votre numéro IFU',
  companyRccm: 'Votre numéro RCCM',
  currency: 'XOF',
  logoUrl: null,
  invoiceNumberFormat: 'PREFIX-YEAR-NUM',
  invoiceTemplate: 'detailed',
};

export const getSettings = cache(
  async (): Promise<Settings> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error || !data) {
      // Insert default settings if none exist
      const { data: insertedData, error: insertError } = await supabase
        .from('settings')
        .upsert({ id: 'main', ...mapKeysToSnake(defaultSettings) })
        .select()
        .single();

      if (insertError || !insertedData) return defaultSettings;
      return { ...defaultSettings, ...rowToEntity<Settings>(insertedData) };
    }

    return { ...defaultSettings, ...rowToEntity<Settings>(data) };
  },
  ['settings'],
  { revalidate: REVALIDATION_TIME, tags: ['settings'] }
);

export async function updateSettings(settingsData: Partial<Settings>): Promise<Settings> {
  const supabase = createClient();
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ...settingsData };

  const { error } = await supabase
    .from('settings')
    .upsert({ id: 'main', ...mapKeysToSnake(newSettings) });

  if (error) throw error;
  return newSettings;
}

// ---- DASHBOARD STATS ----

export const getDashboardStats = cache(async () => {
  const supabase = createClient();

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
    // Invoices for the current fiscal year
    supabase
      .from('invoices')
      .select('total_amount, status')
      .gte('date', fiscalStartDateIso),
    // Unpaid invoices
    supabase
      .from('invoices')
      .select('total_amount, amount_paid, status')
      .in('status', ['Unpaid', 'Partially Paid']),
    // Expenses for the current fiscal year
    supabase
      .from('expenses')
      .select('amount')
      .gte('date', fiscalStartDateIso),
    // Total clients count
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true }),
    // Active clients count
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Active'),
    // Total products count
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true }),
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
},
['dashboard-stats'],
{ revalidate: REVALIDATION_TIME, tags: ['invoices', 'expenses', 'clients', 'products'] });

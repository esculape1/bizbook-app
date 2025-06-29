export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ifu: string;
  rccm: string;
  taxRegime: string;
  registrationDate: string;
  status: 'Active' | 'Inactive';
};

export type Product = {
  id: string;
  name:string;
  reference: string;
  category: string;
  purchasePrice: number;
  unitPrice: number;
  quantityInStock: number;
  reorderPoint: number;
  safetyStock: number;
};

export type InvoiceItem = {
  productId: string;
  productName: string;
  reference: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type QuoteItem = {
  productId: string;
  productName: string;
  reference: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Quote = {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  expiryDate: string;
  items: QuoteItem[];
  subTotal: number;
  vat: number; // as a percentage
  vatAmount: number;
  discount: number; // as a percentage
  discountAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
  method: 'Espèces' | 'Virement bancaire' | 'Chèque' | 'Autre';
  notes?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subTotal: number;
  vat: number; // as a percentage
  vatAmount: number;
  discount: number; // as a percentage
  discountAmount: number;
  totalAmount: number;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
  amountPaid: number;
  payments: Payment[];
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

export type Settings = {
  companyName: string;
  legalName: string;
  managerName: string;
  companyAddress: string;
  companyPhone: string;
  companyIfu: string;
  companyRccm: string;
  currency: 'EUR' | 'USD' | 'GBP' | 'XOF';
  logoUrl?: string;
  invoiceNumberFormat: 'PREFIX-YEAR-NUM' | 'YEAR-NUM' | 'PREFIX-NUM';
  invoiceTemplate: 'modern' | 'classic' | 'simple' | 'detailed';
};

export type ReportData = {
  startDate: Date;
  endDate: Date;
  clientName: string;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalUnpaid: number;
  };
  productSales: {
    productName: string;
    quantitySold: number;
    totalValue: number;
  }[];
  unpaidInvoices: Invoice[];
  allInvoices: Invoice[];
  expenses: Expense[];
} | null;


export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  USER: 'User',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const CLIENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export type ClientStatus = typeof CLIENT_STATUS[keyof typeof CLIENT_STATUS];

export const QUOTE_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
} as const;

export type QuoteStatus = typeof QUOTE_STATUS[keyof typeof QUOTE_STATUS];

export const QUOTE_STATUS_TRANSLATIONS: { [key in QuoteStatus]: string } = {
  [QUOTE_STATUS.DRAFT]: 'Brouillon',
  [QUOTE_STATUS.SENT]: 'Envoyé',
  [QUOTE_STATUS.ACCEPTED]: 'Accepté',
  [QUOTE_STATUS.DECLINED]: 'Refusé',
};

export const INVOICE_STATUS = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  CANCELLED: 'Cancelled',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_TRANSLATIONS: { [key in InvoiceStatus]: string } = {
  [INVOICE_STATUS.PAID]: 'Payée',
  [INVOICE_STATUS.UNPAID]: 'Impayée',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'Partiellement Payée',
  [INVOICE_STATUS.CANCELLED]: 'Annulée',
};

export const PURCHASE_STATUS = {
  PENDING: 'Pending',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
} as const;

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS];

export const PURCHASE_STATUS_TRANSLATIONS: { [key in PurchaseStatus]: string } = {
    [PURCHASE_STATUS.PENDING]: 'En attente',
    [PURCHASE_STATUS.RECEIVED]: 'Reçu',
    [PURCHASE_STATUS.CANCELLED]: 'Annulé',
};

export const PAYMENT_METHODS = {
  CASH: 'Espèces',
  TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
  OTHER: 'Autre',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const EXPENSE_CATEGORIES = {
    FUEL: 'Carburant',
    SALARY: 'Salaire',
    SHIPPING: 'Envois',
    RENT: 'Loyer',
    SAVINGS: 'Épargne',
    OTHER: 'Autre',
} as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES];

export const SETTINGS_CURRENCIES = {
    EUR: 'EUR',
    USD: 'USD',
    GBP: 'GBP',
    XOF: 'XOF',
} as const;
export type Currency = typeof SETTINGS_CURRENCIES[keyof typeof SETTINGS_CURRENCIES];

export const INVOICE_TEMPLATES = {
    MODERN: 'modern',
    CLASSIC: 'classic',
    SIMPLE: 'simple',
    DETAILED: 'detailed',
} as const;
export type InvoiceTemplate = typeof INVOICE_TEMPLATES[keyof typeof INVOICE_TEMPLATES];

export const INVOICE_NUMBER_FORMATS = {
    PREFIX_YEAR_NUM: 'PREFIX-YEAR-NUM',
    YEAR_NUM: 'YEAR-NUM',
    PREFIX_NUM: 'PREFIX-NUM',
} as const;
export type InvoiceNumberFormat = typeof INVOICE_NUMBER_FORMATS[keyof typeof INVOICE_NUMBER_FORMATS];

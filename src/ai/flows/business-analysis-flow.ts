
'use server';
/**
 * @fileOverview An AI agent for business data analysis.
 * - analyzeBusinessData - A function that handles business analysis queries.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getClients, getInvoices, getProducts, getExpenses, getSettings } from '@/lib/data';

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ifu: z.string().optional(),
  rccm: z.string().optional(),
  taxRegime: z.string().optional(),
  registrationDate: z.string().describe("ISO date string"),
  status: z.enum(['Active', 'Inactive']),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  reference: z.string(),
  category: z.string(),
  purchasePrice: z.number(),
  unitPrice: z.number(),
  quantityInStock: z.number(),
  reorderPoint: z.number(),
  safetyStock: z.number(),
});

const InvoiceItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  reference: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

const PaymentSchema = z.object({
  id: z.string(),
  date: z.string().describe("ISO date string"),
  amount: z.number(),
  method: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre']),
  notes: z.string().optional(),
});

const InvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  date: z.string().describe("ISO date string"),
  dueDate: z.string().describe("ISO date string"),
  items: z.array(InvoiceItemSchema),
  subTotal: z.number(),
  vat: z.number(),
  vatAmount: z.number(),
  discount: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  status: z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Cancelled']),
  amountPaid: z.number(),
  payments: z.array(PaymentSchema),
});

const ExpenseSchema = z.object({
  id: z.string(),
  date: z.string().describe("ISO date string"),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
});

const SettingsSchema = z.object({
  companyName: z.string(),
  legalName: z.string(),
  managerName: z.string(),
  companyAddress: z.string(),
  companyPhone: z.string(),
  companyIfu: z.string(),
  companyRccm: z.string(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'XOF']),
  logoUrl: z.string().optional(),
  invoiceNumberFormat: z.enum(['PREFIX-YEAR-NUM', 'YEAR-NUM', 'PREFIX-NUM']),
  invoiceTemplate: z.enum(['modern', 'classic', 'simple', 'detailed']),
});

const getInvoicesTool = ai.defineTool(
  {
    name: 'getInvoices',
    description: 'Récupère la liste de toutes les factures de l\'entreprise.',
    outputSchema: z.array(InvoiceSchema),
  },
  async () => await getInvoices()
);

const getExpensesTool = ai.defineTool(
  {
    name: 'getExpenses',
    description: 'Récupère la liste de toutes les dépenses de l\'entreprise.',
    outputSchema: z.array(ExpenseSchema),
  },
  async () => await getExpenses()
);

const getProductsTool = ai.defineTool(
  {
    name: 'getProducts',
    description: 'Récupère la liste de tous les produits en stock ou catalogués.',
    outputSchema: z.array(ProductSchema),
  },
  async () => await getProducts()
);

const getClientsTool = ai.defineTool(
  {
    name: 'getClients',
    description: 'Récupère la liste de tous les clients de l\'entreprise.',
    outputSchema: z.array(ClientSchema),
  },
  async () => await getClients()
);

const getSettingsTool = ai.defineTool(
  {
    name: 'getSettings',
    description: 'Récupère les paramètres de l\'entreprise, comme le nom ou la devise par défaut (currency).',
    outputSchema: SettingsSchema,
  },
  async () => await getSettings()
);

const businessAnalysisFlow = ai.defineFlow(
    {
        name: 'businessAnalysisFlow',
        inputSchema: z.string().describe("La question de l'utilisateur"),
        outputSchema: z.string().describe("La réponse de l'assistant IA"),
    },
    async (query) => {
        const { text } = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: query,
            system: `Tu es un assistant expert en analyse de données pour une entreprise qui utilise l'application BizBook.
Ta mission est de répondre aux questions de l'utilisateur en te basant exclusivement sur les données fournies par les outils à ta disposition.
Sois concis, précis et professionnel.
Réponds toujours en français.
La date d'aujourd'hui est le ${new Date().toLocaleDateString('fr-FR')}. Utilise cette information pour interpréter les questions relatives au temps (ex: "ce mois-ci", "la semaine dernière").
N'invente jamais d'informations. Si les données ne sont pas disponibles pour répondre à une question, indique-le clairement à l'utilisateur.
Utilise l'outil getSettings pour connaître la devise de l'entreprise et formate tous les montants monétaires en conséquence.`,
            tools: [getInvoicesTool, getExpensesTool, getProductsTool, getClientsTool, getSettingsTool],
        });

        return text || '';
    }
);

export async function analyzeBusinessData(query: string): Promise<string> {
    return businessAnalysisFlow(query);
}

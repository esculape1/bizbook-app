
'use server';
/**
 * @fileOverview An AI agent for business data analysis.
 * - analyzeBusinessData - A function that handles business analysis queries.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getClients, getInvoices, getProducts, getExpenses, getSettings } from '@/lib/data';
import type { Client, Invoice, Product, Expense } from '@/lib/types';

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  ifu: z.string().nullable().optional(),
  rccm: z.string().nullable().optional(),
  taxRegime: z.string().nullable().optional(),
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
  notes: z.string().nullable().optional(),
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
  logoUrl: z.string().nullable().optional(),
  invoiceNumberFormat: z.enum(['PREFIX-YEAR-NUM', 'YEAR-NUM', 'PREFIX-NUM']),
  invoiceTemplate: z.enum(['modern', 'classic', 'simple', 'detailed']),
});

const getInvoicesTool = ai.defineTool(
  {
    name: 'getInvoices',
    description: "Récupère la liste de toutes les factures de l'entreprise.",
    outputSchema: z.array(InvoiceSchema),
  },
  async () => {
    const rawData = await getInvoices();
    const validData: z.infer<typeof InvoiceSchema>[] = [];
    for (const item of rawData) {
        const parsed = InvoiceSchema.safeParse(item);
        if (parsed.success) {
            validData.push(parsed.data);
        } else {
            const itemId = (item && typeof item === 'object' && (item as any).id) ? (item as any).id : 'ID inconnu';
            console.warn(`Skipping invalid invoice object (ID: ${itemId}):`, parsed.error.flatten());
        }
    }
    return validData;
  }
);

const getExpensesTool = ai.defineTool(
  {
    name: 'getExpenses',
    description: "Récupère la liste de toutes les dépenses de l'entreprise.",
    outputSchema: z.array(ExpenseSchema),
  },
  async () => {
    const rawData = await getExpenses();
    const validData: z.infer<typeof ExpenseSchema>[] = [];
    for (const item of rawData) {
        const parsed = ExpenseSchema.safeParse(item);
        if (parsed.success) {
            validData.push(parsed.data);
        } else {
            const itemId = (item && typeof item === 'object' && (item as any).id) ? (item as any).id : 'ID inconnu';
            console.warn(`Skipping invalid expense object (ID: ${itemId}):`, parsed.error.flatten());
        }
    }
    return validData;
  }
);

const getProductsTool = ai.defineTool(
  {
    name: 'getProducts',
    description: "Récupère la liste de tous les produits en stock ou catalogués.",
    outputSchema: z.array(ProductSchema),
  },
  async () => {
    const rawData = await getProducts();
    const validData: z.infer<typeof ProductSchema>[] = [];
    for (const item of rawData) {
        const parsed = ProductSchema.safeParse(item);
        if (parsed.success) {
            validData.push(parsed.data);
        } else {
            const itemId = (item && typeof item === 'object' && (item as any).id) ? (item as any).id : 'ID inconnu';
            console.warn(`Skipping invalid product object (ID: ${itemId}):`, parsed.error.flatten());
        }
    }
    return validData;
  }
);

const getClientsTool = ai.defineTool(
  {
    name: 'getClients',
    description: "Récupère la liste de tous les clients de l'entreprise.",
    outputSchema: z.array(ClientSchema),
  },
  async () => {
    const rawData = await getClients();
    const validData: z.infer<typeof ClientSchema>[] = [];
    for (const item of rawData) {
        const parsed = ClientSchema.safeParse(item);
        if (parsed.success) {
            validData.push(parsed.data);
        } else {
            const itemId = (item && typeof item === 'object' && (item as any).id) ? (item as any).id : 'ID inconnu';
            console.warn(`Skipping invalid client object (ID: ${itemId}):`, parsed.error.flatten());
        }
    }
    return validData;
  }
);

const getSettingsTool = ai.defineTool(
  {
    name: 'getSettings',
    description: "Récupère les paramètres de l'entreprise, comme le nom ou la devise par défaut (currency).",
    outputSchema: SettingsSchema,
  },
  async () => {
    const rawData = await getSettings();
    const parsed = SettingsSchema.safeParse(rawData);
    if (parsed.success) {
        return parsed.data;
    }
    // This should ideally not fail, but as a fallback, return a default-like structure.
    console.error("Failed to parse settings, returning a fallback. Please check your settings data.", parsed.error.flatten());
    return {
        companyName: 'Erreur Paramètres',
        legalName: 'Erreur Paramètres',
        managerName: 'Erreur Paramètres',
        companyAddress: '',
        companyPhone: '',
        companyIfu: '',
        companyRccm: '',
        currency: 'XOF',
        invoiceNumberFormat: 'PREFIX-YEAR-NUM',
        invoiceTemplate: 'detailed',
    }
  }
);

const businessAnalysisFlow = ai.defineFlow(
    {
        name: 'businessAnalysisFlow',
        inputSchema: z.string().describe("La question de l'utilisateur"),
        outputSchema: z.string().describe("La réponse de l'assistant IA"),
    },
    async (query) => {
        const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
        const systemPrompt = `Tu es un assistant expert en analyse de données pour une entreprise qui utilise l'application BizBook.
Ta mission est de répondre aux questions de l'utilisateur en te basant exclusivement sur les données fournies par les outils à ta disposition.
Sois concis, précis et professionnel.
Réponds toujours en français.
La date d'aujourd'hui est le ${today}. Utilise cette information pour interpréter les questions relatives au temps (ex: "ce mois-ci", "la semaine dernière").
N'invente jamais d'informations. Si les données ne sont pas disponibles pour répondre à une question, indique-le clairement à l'utilisateur.
Utilise l'outil getSettings pour connaître la devise de l'entreprise et formate tous les montants monétaires en conséquence.`;

        const { text } = await ai.generate({
            model: 'googleai/gemini-1.5-pro-latest',
            prompt: query,
            system: systemPrompt,
            tools: [getInvoicesTool, getExpensesTool, getProductsTool, getClientsTool, getSettingsTool],
        });

        return text || "Je n'ai pas pu trouver de réponse à votre question. Veuillez réessayer.";
    }
);

export async function analyzeBusinessData(query: string): Promise<string> {
    return businessAnalysisFlow(query);
}


'use server';
/**
 * @fileOverview An AI agent for business data analysis.
 * - analyzeBusinessData - A function that handles business analysis queries.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getClients, getInvoices, getProducts, getExpenses, getSettings } from '@/lib/data';
import { isWithinInterval } from 'date-fns';

const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  ifu: z.string().nullable().optional(),
  rccm: z.string().nullable().optional(),
  taxRegime: z.string().nullable().optional(),
  registrationDate: z.string().describe("Date de création du client au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ)."),
  status: z.enum(['Active', 'Inactive']),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  reference: z.string(),
  category: z.string(),
  purchasePrice: z.coerce.number().nullable().optional().default(0),
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
  date: z.string().describe("Date au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ)."),
  amount: z.number(),
  method: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre']),
  notes: z.string().nullable().optional(),
});

const InvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  date: z.string().describe("Date de facturation au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ)."),
  dueDate: z.string().describe("Date d'échéance au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ)."),
  items: z.array(InvoiceItemSchema),
  subTotal: z.number(),
  vat: z.number(),
  vatAmount: z.number(),
  discount: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  status: z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Cancelled']),
  amountPaid: z.number(),
  payments: z.array(PaymentSchema).nullable().optional(),
});

const ExpenseSchema = z.object({
  id: z.string(),
  date: z.string().describe("Date de la dépense au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ)."),
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
    description: "Récupère la liste des factures. Peut filtrer par client, par période, ou les deux.",
    inputSchema: z.object({
        startDate: z.string().optional().describe("Date de début au format AAAA-MM-JJ. Si non fournie, pas de limite de début."),
        endDate: z.string().optional().describe("Date de fin au format AAAA-MM-JJ. Si non fournie, pas de limite de fin."),
        clientId: z.string().optional().describe("ID du client pour filtrer les factures d'un client spécifique."),
    }),
    outputSchema: z.array(InvoiceSchema),
  },
  async ({ startDate, endDate, clientId }) => {
    const rawData = await getInvoices();
    
    let filteredData = rawData;
    
    // Filter by client ID if provided
    if (clientId) {
      filteredData = filteredData.filter(inv => inv.clientId === clientId);
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
        const interval = {
            start: startDate ? new Date(startDate) : new Date(0),
            end: endDate ? new Date(endDate) : new Date()
        };
        filteredData = filteredData.filter(inv => isWithinInterval(new Date(inv.date), interval));
    }

    const validData: z.infer<typeof InvoiceSchema>[] = [];
    for (const item of filteredData) {
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
    description: "Récupère la liste des dépenses de l'entreprise. Peut filtrer par période (startDate, endDate).",
    inputSchema: z.object({
      startDate: z.string().optional().describe("Date de début au format AAAA-MM-JJ. Si non fournie, pas de limite de début."),
      endDate: z.string().optional().describe("Date de fin au format AAAA-MM-JJ. Si non fournie, pas de limite de fin.")
    }),
    outputSchema: z.array(ExpenseSchema),
  },
  async ({ startDate, endDate }) => {
    const rawData = await getExpenses();

    let filteredData = rawData;
    if (startDate || endDate) {
        const interval = {
            start: startDate ? new Date(startDate) : new Date(0),
            end: endDate ? new Date(endDate) : new Date()
        };
        filteredData = rawData.filter(exp => isWithinInterval(new Date(exp.date), interval));
    }

    const validData: z.infer<typeof ExpenseSchema>[] = [];
    for (const item of filteredData) {
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
    description: "Récupère la liste de tous les produits, y compris leur prix d'achat, nécessaire pour calculer la rentabilité.",
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
    description: "Récupère la liste de tous les clients de l'entreprise. Permet de trouver un client par son nom pour obtenir son ID.",
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
  async (): Promise<z.infer<typeof SettingsSchema>> => {
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
        logoUrl: null,
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
        const systemPrompt = `Tu es un assistant expert en analyse de données pour une entreprise qui utilise l'application BizBook.
Ta mission est de répondre aux questions de l'utilisateur en te basant exclusivement sur les données fournies par les outils à ta disposition.
Sois concis, précis et professionnel.
Réponds toujours en français.
La date d'aujourd'hui est le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}. Utilise cette information pour interpréter les questions relatives au temps (ex: "ce mois-ci", "la semaine dernière").
N'invente jamais d'informations. Si les données ne sont pas disponibles pour répondre à une question, indique-le clairement à l'utilisateur.

IMPORTANT : Pour répondre aux questions, tu dois souvent croiser les données de plusieurs outils. Voici comment raisonner :
- Chiffre d'affaires (CA) : Somme des 'totalAmount' des factures ('invoices') sur une période. N'utilise que les factures qui ne sont pas 'Cancelled'.
- Bénéfice : C'est le (Chiffre d'affaires) - (Coût des marchandises vendues) - (Dépenses).
- Coût des marchandises vendues (CMV) : Pour chaque article vendu dans une facture, trouve son prix d'achat ('purchasePrice') dans la liste des produits ('products') et multiplie-le par la quantité vendue. La somme de ces coûts est le CMV.
- Produit le plus vendu : Utilise les factures ('invoices') pour compter la quantité ('quantity') de chaque 'productId' vendu sur la période, puis identifie celui avec le total le plus élevé.
- Produit le plus rentable : Pour chaque produit, calcule sa marge (prix de vente - prix d'achat) et multiplie par la quantité vendue. Le prix de vente est dans l'article de la facture, le prix d'achat ('purchasePrice') est dans la liste des produits.
- Client avec le plus grand CA : Pour trouver le CA d'un client, utilise getClientsTool pour trouver son ID, puis utilise cet ID pour filtrer avec getInvoicesTool. Ensuite, somme leurs 'totalAmount' sur la période.

Utilise l'outil getSettings pour connaître la devise de l'entreprise et formate tous les montants monétaires en conséquence.`;

        const { text } = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
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

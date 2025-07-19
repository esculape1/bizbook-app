
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
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  ifu: z.string().nullable().optional(),
  rccm: z.string().nullable().optional(),
  taxRegime: z.string().nullable().optional(),
  registrationDate: z.string().describe("Date de création du client au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ).").nullable().optional(),
  status: z.enum(['Active', 'Inactive']).nullable().optional(),
});

const ProductSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  purchasePrice: z.coerce.number().nullable().optional().default(0),
  unitPrice: z.number().nullable().optional(),
  quantityInStock: z.number().nullable().optional(),
  reorderPoint: z.number().nullable().optional(),
  safetyStock: z.number().nullable().optional(),
});

const InvoiceItemSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
});

const PaymentSchema = z.object({
  id: z.string().nullable().optional(),
  date: z.string().describe("Date au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ).").nullable().optional(),
  amount: z.number().nullable().optional(),
  method: z.enum(['Espèces', 'Virement bancaire', 'Chèque', 'Autre']).nullable().optional(),
  notes: z.string().nullable().optional(),
});

const InvoiceSchema = z.object({
  id: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  date: z.string().describe("Date de facturation au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ).").nullable().optional(),
  dueDate: z.string().describe("Date d'échéance au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ).").nullable().optional(),
  items: z.array(InvoiceItemSchema).nullable().optional(),
  subTotal: z.number().nullable().optional(),
  vat: z.number().nullable().optional(),
  vatAmount: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  discountAmount: z.number().nullable().optional(),
  totalAmount: z.number().nullable().optional(),
  status: z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Cancelled']).nullable().optional(),
  amountPaid: z.number().nullable().optional(),
  payments: z.array(PaymentSchema).nullable().optional(),
});

const ExpenseSchema = z.object({
  id: z.string().nullable().optional(),
  date: z.string().describe("Date de la dépense au format ISO (YYYY-MM-DDTHH:mm:ss.sssZ).").nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
});

const SettingsSchema = z.object({
  companyName: z.string().nullable().optional(),
  legalName: z.string().nullable().optional(),
  managerName: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  companyPhone: z.string().nullable().optional(),
  companyIfu: z.string().nullable().optional(),
  companyRccm: z.string().nullable().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'XOF']).nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  invoiceNumberFormat: z.enum(['PREFIX-YEAR-NUM', 'YEAR-NUM', 'PREFIX-NUM']).nullable().optional(),
  invoiceTemplate: z.enum(['modern', 'classic', 'simple', 'detailed']).nullable().optional(),
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
    
    if (clientId) {
      filteredData = filteredData.filter(inv => inv.clientId === clientId);
    }
    
    if (startDate || endDate) {
        const interval = {
            start: startDate ? new Date(startDate) : new Date(0),
            end: endDate ? new Date(endDate) : new Date()
        };
        filteredData = filteredData.filter(inv => {
            try {
                return isWithinInterval(new Date(inv.date), interval);
            } catch (e) {
                return false;
            }
        });
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
        filteredData = rawData.filter(exp => {
            try {
                return isWithinInterval(new Date(exp.date), interval);
            } catch(e) {
                return false;
            }
        });
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


const analysisPrompt = ai.definePrompt(
    {
        name: 'businessAnalysisPrompt',
        input: { schema: z.string() },
        output: { schema: z.string() },
        model: 'googleai/gemini-1.5-flash',
        tools: [getInvoicesTool, getExpensesTool, getProductsTool, getClientsTool, getSettingsTool],
        system: `Tu es un assistant expert en analyse de données pour l'application BizBook.
Ta mission est de répondre aux questions de l'utilisateur en utilisant les outils à ta disposition.
Tu DOIS utiliser les outils pour obtenir les données. Ne demande jamais à l'utilisateur de te fournir les données.
Sois concis, précis et professionnel. Réponds toujours en français.
La date d'aujourd'hui est le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}. Utilise cette information pour interpréter les questions relatives au temps (ex: "ce mois-ci", "la semaine dernière").
N'invente jamais d'informations. Si les données ne sont pas disponibles pour répondre à une question, indique-le clairement.

IMPORTANT : Pour répondre, tu dois IMPÉRATIVEMENT croiser les données de plusieurs outils. Voici ta logique de raisonnement :

1.  **Pour toute question sur un client spécifique (ex: "Quel est le CA de DLG?")** :
    a. D'abord, utilise \`getClientsTool\` pour trouver l'ID du client "DLG".
    b. Ensuite, utilise cet ID pour appeler \`getInvoicesTool\` en passant l'ID dans le champ \`clientId\`.
    c. Calcule le résultat à partir des factures filtrées.

2.  **Pour toute question sur une période (ex: "le mois dernier")** :
    a. Détermine les dates de début et de fin correspondantes.
    b. Utilise ces dates pour appeler \`getInvoicesTool\` et/ou \`getExpensesTool\` avec \`startDate\` et \`endDate\`.

3.  **Pour calculer le CHIFFRE D'AFFAIRES (CA)** :
    a. Appelle \`getInvoicesTool\` (avec les filtres de date/client si nécessaire).
    b. Somme le champ \`totalAmount\` de toutes les factures retournées qui ne sont PAS annulées ('Cancelled').

4.  **Pour calculer le BÉNÉFICE** :
    a. Calcule le Chiffre d'Affaires (voir ci-dessus).
    b. Calcule le Coût des Marchandises Vendues (CMV) : Pour chaque article vendu dans les factures concernées, trouve son \`purchasePrice\` avec \`getProductsTool\` et multiplie par la quantité vendue. La somme de ces coûts est le CMV.
    c. Calcule le total des dépenses avec \`getExpensesTool\`.
    d. Le bénéfice est : CA - CMV - Dépenses.

5.  **Pour trouver le PRODUIT LE PLUS VENDU** :
    a. Utilise \`getInvoicesTool\` pour la période.
    b. Pour chaque produit, somme les quantités (\`quantity\`) vendues dans toutes les factures.
    c. L'article avec la plus grande quantité totale est le plus vendu.

6.  **Pour trouver le PRODUIT LE PLUS RENTABLE** :
    a. Utilise \`getProductsTool\` pour avoir le prix d'achat (\`purchasePrice\`) de chaque produit.
    b. Utilise \`getInvoicesTool\` pour la période.
    c. Pour chaque article vendu : calcule la marge (\`unitPrice\` de la facture - \`purchasePrice\` du produit) et multiplie par la quantité vendue.
    d. Le produit avec la plus grande marge totale est le plus rentable.

Utilise l'outil \`getSettings\` pour connaître la devise de l'entreprise et formate tous les montants monétaires en conséquence dans ta réponse finale.`,
        config: {
            toolRequest: 'parallel',
        },
    },
);


const businessAnalysisFlow = ai.defineFlow(
    {
        name: 'businessAnalysisFlow',
        inputSchema: z.string().describe("La question de l'utilisateur"),
        outputSchema: z.string().describe("La réponse de l'assistant IA"),
    },
    async (query) => {
        const response = await analysisPrompt(query);
        // Robust check for the response and its output.
        if (!response || !response.output) {
            return "Je n'ai pas pu générer de réponse. Le modèle n'a fourni aucune sortie. Veuillez reformuler votre question ou vérifier les données.";
        }
        return response.output;
    }
);

export async function analyzeBusinessData(query: string): Promise<string> {
    return businessAnalysisFlow(query);
}

    
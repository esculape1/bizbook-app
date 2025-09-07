
'use server';
/**
 * @fileOverview An AI agent for business data analysis.
 * - analyzeBusinessData - a function that handles business analysis queries.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getClients, getInvoices, getProducts, getExpenses, getSettings } from '@/lib/data';
import { isWithinInterval } from 'date-fns';
import { googleAI } from '@genkit-ai/googleai';

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
    let rawData = await getInvoices();
    
    if (clientId) {
      rawData = rawData.filter(inv => inv.clientId === clientId);
    }
    
    if (startDate || endDate) {
        const interval = {
            start: startDate ? new Date(startDate) : new Date(0),
            end: endDate ? new Date(endDate) : new Date()
        };
        rawData = rawData.filter(inv => {
            try {
                return inv.date && isWithinInterval(new Date(inv.date), interval);
            } catch (e) {
                return false;
            }
        });
    }

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
    description: "Récupère la liste des dépenses de l'entreprise. Peut filtrer par période (startDate, endDate).",
    inputSchema: z.object({
      startDate: z.string().optional().describe("Date de début au format AAAA-MM-JJ. Si non fournie, pas de limite de début."),
      endDate: z.string().optional().describe("Date de fin au format AAAA-MM-JJ. Si non fournie, pas de limite de fin.")
    }),
    outputSchema: z.array(ExpenseSchema),
  },
  async ({ startDate, endDate }) => {
    let rawData = await getExpenses();

    if (startDate || endDate) {
        const interval = {
            start: startDate ? new Date(startDate) : new Date(0),
            end: endDate ? new Date(endDate) : new Date()
        };
        rawData = rawData.filter(exp => {
            try {
                return exp.date && isWithinInterval(new Date(exp.date), interval);
            } catch(e) {
                return false;
            }
        });
    }

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

const systemPrompt = `Tu es un assistant expert en analyse de données pour l'application BizBook.
Ta mission est de répondre aux questions de l'utilisateur en utilisant les outils à ta disposition pour récupérer les données.
Tu DOIS utiliser les outils pour obtenir les données. Ne demande jamais à l'utilisateur de te fournir les données.
Sois concis, précis et professionnel. Réponds toujours en français.
La date d'aujourd'hui est le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}. Utilise cette information pour interpréter les questions relatives au temps (ex: "ce mois-ci", "la semaine dernière").
N'invente jamais d'informations. Si les données ne sont pas disponibles pour répondre à une question, indique-le clairement.

LOGIQUE DE RAISONNEMENT OBLIGATOIRE :

1.  **DÉCODAGE DE LA QUESTION DE L'UTILISATEUR :**
    *   **Période :** Si la question mentionne une période (ex: "le mois dernier", "cette année", "du 1er janvier au 31 mars"), détermine les dates de début (\`startDate\`) et de fin (\`endDate\`) exactes.
    *   **Client :** Si un nom de client est mentionné (ex: "le client DLG"), tu dois d'abord utiliser \`getClientsTool\` pour trouver l'ID exact de ce client.
    *   **Produit :** Si un nom de produit est mentionné, tu devras utiliser \`getProductsTool\` pour trouver des informations sur ce produit.

2.  **UTILISATION DES OUTILS :** Appelle les outils nécessaires avec les bons paramètres.

3.  **CALCULS ET ANALYSE :** Une fois les données reçues, effectue les calculs suivants :

    *   **CHIFFRE D'AFFAIRES (CA) :**
        1.  Utilise \`getInvoicesTool\` avec les bons filtres (période, client).
        2.  Fais la somme du champ \`totalAmount\` de TOUTES les factures retournées qui ne sont PAS annulées (\`status\` n'est pas 'Cancelled').

    *   **BÉNÉFICE :**
        1.  Calcule le CA (voir ci-dessus).
        2.  Calcule le Coût des Marchandises Vendues (CMV) :
            a. Pour chaque facture non annulée, parcours ses \`items\`.
            b. Pour chaque \`item\`, utilise \`getProductsTool\` pour trouver le produit correspondant (\`productId\`) et obtenir son \`purchasePrice\`.
            c. Multiplie la \`quantity\` de l'item par son \`purchasePrice\`.
            d. La somme de tous ces coûts est le CMV.
        3.  Calcule le total des dépenses avec \`getExpensesTool\` (filtré par période).
        4.  **Bénéfice = CA - CMV - Dépenses.**

    *   **PRODUIT LE PLUS VENDU (en quantité) :**
        1.  Utilise \`getInvoicesTool\` (avec filtre de période/client si besoin).
        2.  Crée un compteur pour chaque \`productId\`.
        3.  Parcours toutes les factures non annulées et leurs \`items\`, en ajoutant la \`quantity\` au compteur du bon produit.
        4.  Identifie le produit avec la plus grande quantité totale.

    *   **PRODUIT LE PLUS RENTABLE :**
        1.  Utilise \`getInvoicesTool\` et \`getProductsTool\`.
        2.  Crée un compteur de marge pour chaque produit.
        3.  Parcours les factures non annulées et pour chaque \`item\`, calcule la marge de cet item : (\`unitPrice\` de la facture - \`purchasePrice\` du produit) * \`quantity\`.
        4.  Ajoute cette marge au compteur du produit.
        5.  Identifie le produit avec la plus grande marge totale.

    *   **CLIENT LE PLUS IMPORTANT (en CA) :**
        1.  Utilise \`getInvoicesTool\` pour la période demandée (sans filtre client).
        2.  Crée un compteur de CA pour chaque \`clientId\`.
        3.  Parcours les factures non annulées, ajoute le \`totalAmount\` au compteur du client correspondant.
        4.  Trouve le client avec le plus grand CA. Utilise \`getClientsTool\` si besoin pour retrouver son nom.

    *   **QUANTITÉ D'UN ARTICLE COMMANDÉ PAR UN CLIENT :**
        1.  Utilise \`getClientsTool\` pour trouver l'ID du client.
        2.  Utilise \`getInvoicesTool\` avec le \`clientId\` et la période.
        3.  Filtre les factures non annulées.
        4.  Parcours les \`items\` de ces factures, et fais la somme des \`quantity\` pour le produit demandé (identifié par son nom ou sa référence).

4.  **FORMATAGE DE LA RÉPONSE :**
    *   Utilise \`getSettings\` pour connaître la devise de l'entreprise.
    *   Formate TOUS les montants monétaires dans ta réponse finale en utilisant cette devise (ex: "1 500 000 F CFA").
    *   Sois clair et direct. Commence par la réponse, puis donne une brève explication de ton calcul si nécessaire.
    *   Exemple : "Le chiffre d'affaires pour le client DLG le mois dernier était de 1 500 000 F CFA. Ce calcul est basé sur la somme des factures X, Y et Z."`;

const businessAnalysisFlow = ai.defineFlow(
    {
        name: 'businessAnalysisFlow',
        inputSchema: z.string().describe("La question de l'utilisateur"),
        outputSchema: z.string().describe("La réponse de l'assistant IA"),
    },
    async (query) => {
        if (!query) {
            return "Veuillez fournir une question pour l'analyse.";
        }
        
        const llm = googleAI.model('gemini-1.5-flash');
        const response = await ai.generate({
            model: llm,
            prompt: query,
            system: systemPrompt,
            tools: [getInvoicesTool, getExpensesTool, getProductsTool, getClientsTool, getSettingsTool],
            output: {
                schema: z.string()
            }
        });
        
        if (!response || !response.output) {
            return "Je n'ai pas pu générer de réponse. Le modèle n'a fourni aucune sortie. Veuillez reformuler votre question ou vérifier les données.";
        }
        
        return response.output;
    }
);

export async function analyzeBusinessData(query: string): Promise<string> {
    return businessAnalysisFlow(query);
}

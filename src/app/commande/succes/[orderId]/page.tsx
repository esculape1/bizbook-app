
import { getClientOrderById, getClientById, getSettings } from "@/lib/data";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, MessageSquare, PlusCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { orderId: string } }) {
    const order = await getClientOrderById(params.orderId);
    if (!order) {
        return {
            title: "Commande non trouvée",
        }
    }
    return {
        title: `Confirmation de commande ${order.orderNumber}`,
    }
}

export default async function OrderSuccessPage({ params }: { params: { orderId: string } }) {
    const order = await getClientOrderById(params.orderId);
    
    if (!order) {
        notFound();
    }

    const [client, settings] = await Promise.all([
        getClientById(order.clientId),
        getSettings()
    ]);
    
    if (!client || !settings) {
        // This should not happen if data is consistent
        notFound();
    }

    const whatsappLink = "https://wa.me/message/YZS5BF6UL4G3K1";
    const prefilledMessage = `Bonjour, je viens de passer la commande N° ${order.orderNumber} d'un montant de ${formatCurrency(order.totalAmount, settings.currency)}. Merci.`;
    const finalWhatsAppLink = `${whatsappLink}&text=${encodeURIComponent(prefilledMessage)}`;
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-muted/30">
            <Card className="w-full max-w-md shadow-2xl border-emerald-500/50 bg-emerald-500/10">
                <CardHeader className="items-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                    <CardTitle className="text-2xl font-bold text-emerald-800">Commande envoyée !</CardTitle>
                    <CardDescription className="text-emerald-700/80">Votre commande a été reçue avec succès.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-background/50 rounded-lg text-left text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Client:</span>
                            <span className="font-semibold">{client.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">N° Commande:</span>
                            <span className="font-semibold">{order.orderNumber}</span>
                        </div>
                            <div className="flex justify-between">
                            <span className="text-muted-foreground">Montant Total:</span>
                            <span className="font-semibold">{formatCurrency(order.totalAmount, settings.currency)}</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Cliquez sur le bouton ci-dessous pour nous notifier rapidement sur WhatsApp.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                        <Button asChild className="w-full h-12 bg-green-500 hover:bg-green-600 text-white">
                            <a
                            href={finalWhatsAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Notifier sur WhatsApp
                        </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/commande/${client.id}`}>
                           <PlusCircle className="mr-2 h-4 w-4" />
                           Passer une autre commande
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

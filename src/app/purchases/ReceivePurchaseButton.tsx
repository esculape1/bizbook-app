
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { receivePurchase } from './actions';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ReceivePurchaseButton({ purchaseId, purchaseNumber, disabled }: { purchaseId: string, purchaseNumber: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleReceive = () => {
    startTransition(async () => {
      const result = await receivePurchase(purchaseId);
      if (result?.success) {
        toast({
          title: "Achat réceptionné",
          description: `L'achat ${purchaseNumber} a été marqué comme reçu et le stock a été mis à jour.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.message || "La réception de l'achat a échoué.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="success" className="h-8 text-xs" disabled={disabled}>
          Réceptionner
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la réception de l'achat ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action marquera l'achat "{purchaseNumber}" comme reçu et ajoutera les quantités de produits au stock. Le prix d'achat moyen des produits sera recalculé. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleReceive} disabled={isPending} className="bg-success hover:bg-success/90">
            {isPending ? "Réception..." : "Confirmer la réception"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

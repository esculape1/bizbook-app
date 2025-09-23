
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';
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
        <Button variant="ghost" size="icon" disabled={disabled} title="Réceptionner l'achat">
          <CheckCheck className="h-4 w-4 text-green-600" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la réception de l'achat ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action marquera l'achat "{purchaseNumber}" comme reçu et ajoutera les quantités de produits au stock. Cette action est irréversible.
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

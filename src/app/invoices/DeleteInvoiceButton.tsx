
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FileX } from 'lucide-react';
import { cancelInvoice } from './actions';
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

export function CancelInvoiceButton({ id, invoiceNumber, disabled }: { id: string, invoiceNumber: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelInvoice(id);
      if (result?.success) {
        toast({
          title: "Facture annulée",
          description: `La facture ${invoiceNumber} a été annulée avec succès et le stock a été restauré.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.message || "L'annulation de la facture a échoué.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled} title="Annuler la facture">
          <FileX className="h-5 w-5 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir annuler cette facture ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La facture "{invoiceNumber}" sera marquée comme annulée et les produits seront remis en stock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Annulation..." : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

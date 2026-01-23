'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { cancelClientOrder } from './actions';
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
} from "@/components/ui/alert-dialog";

export function CancelClientOrderButton({ orderId, orderNumber }: { orderId: string, orderNumber: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelClientOrder(orderId);
      if (result.success) {
        toast({
          title: "Commande annulée",
          description: `La commande ${orderNumber} a été annulée.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur d'annulation",
          description: result.message || "Une erreur est survenue.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <XCircle className="mr-2 h-4 w-4" />
          Annuler
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Voulez-vous vraiment annuler cette commande ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La commande client "{orderNumber}" sera marquée comme "Annulée" et ne pourra plus être traitée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Retour</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Annulation..." : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

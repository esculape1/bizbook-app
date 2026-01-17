
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { FileX } from 'lucide-react';
import { cancelPurchase } from './actions';
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
import type { Purchase, User } from '@/lib/types';


export function CancelPurchaseButton({ id, purchaseNumber, purchaseStatus, userRole }: { id: string, purchaseNumber: string, purchaseStatus: Purchase['status'], userRole: User['role'] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelPurchase(id);
      if (result?.success) {
        toast({
          title: "Achat annulé",
          description: `L'achat ${purchaseNumber} a été annulé avec succès.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.message || "L'annulation de l'achat a échoué.",
        });
      }
    });
  };

  const isCancelDisabled = userRole !== 'SuperAdmin' && (purchaseStatus === 'Received' || purchaseStatus === 'Cancelled');

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isCancelDisabled} title="Annuler l'achat">
          <FileX className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir annuler cet achat ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. L'achat "{purchaseNumber}" sera marqué comme annulé. Le SuperAdmin peut annuler un achat même s'il a été réceptionné, mais cette action ne modifiera pas le stock.
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

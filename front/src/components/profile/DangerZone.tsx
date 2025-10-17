import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DangerZoneProps {
  onDeleteAccount: () => Promise<void>;
}

export const DangerZone = ({ onDeleteAccount }: DangerZoneProps) => {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDelete = async () => {
    setIsDeletingAccount(true);
    await onDeleteAccount();
    setIsDeletingAccount(false);
  };

  return (
    <div className="rounded-lg border border-destructive/50 p-6 bg-destructive/5">
      <h3 className="text-lg font-semibold text-destructive mb-4">Zone de danger</h3>
      <p className="text-sm text-gray-600 mb-4">
        La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isDeletingAccount}>
            {isDeletingAccount ? "Suppression..." : "Supprimer mon compte"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle supprimera définitivement votre compte et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "Suppression..." : "Je suis sûr, supprimer mon compte"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
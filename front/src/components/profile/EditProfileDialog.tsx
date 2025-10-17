import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditProfileForm } from "./EditProfileForm";

interface EditProfileDialogProps {
  user;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedUser) => void;
}

export const EditProfileDialog = ({
  user,
  open,
  onOpenChange,
  onUpdate,
}: EditProfileDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
        </DialogHeader>
        <EditProfileForm
          onClose={() => onOpenChange(false)}
          onUpdate={onUpdate}
        />
      </DialogContent>
    </Dialog>
  );
};
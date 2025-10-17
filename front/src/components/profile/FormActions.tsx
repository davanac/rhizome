import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onClose: () => void;
  loading: boolean;
}

export const FormActions = ({ onClose, loading }: FormActionsProps) => {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        Annuler
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </div>
  );
};
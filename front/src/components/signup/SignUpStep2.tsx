import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";

interface SignUpStep2Props {
  formData: {
    accountType: string;
    firstName: string;
    lastName: string;
    username: string;
    entreprise: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

export const SignUpStep2 = ({ 
  formData,
  onChange,
  onNext,
  onBack,
  loading 
}: SignUpStep2Props) => {
  return (
    <div className="space-y-6">
      {formData.accountType === 'individual' && (
        <>
          <FormField label="Prénom" required>
            <Input
              required
              value={formData.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              placeholder="Votre prénom"
            />
          </FormField>

          <FormField label="Nom" required>
            <Input
              required
              value={formData.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder="Votre nom"
            />
          </FormField>
        </>
      )}

      {formData.accountType === 'collectif' && (
        <FormField label="Nom du collectif" required>
          <Input
            required
            value={formData.entreprise}
            onChange={(e) => onChange('entreprise', e.target.value)}
            placeholder="Nom de votre collectif"
          />
        </FormField>
      )}

      <FormField label="Nom d'utilisateur" required>
        <Input
          required
          value={formData.username}
          onChange={(e) => onChange('username', e.target.value)}
          placeholder="votre-nom-utilisateur"
        />
      </FormField>

      <div className="flex gap-4">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={onBack}
          disabled={loading}
        >
          Retour
        </Button>
        <Button 
          type="button" 
          className="flex-1"
          onClick={onNext}
          disabled={loading}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};
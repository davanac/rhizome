import { Input } from "@/components/ui/input";
import { FormField } from "@/components/signup/FormField";

interface EnterpriseFieldsProps {
  collectif: string;
  required?: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export const EnterpriseFields = ({
  collectif,
  required = false,
  onFieldChange,
}: EnterpriseFieldsProps) => {
  return (
    <FormField label="Nom du collectif" required={required}>
      <Input
        value={collectif}
        onChange={(e) => onFieldChange("collectif", e.target.value)}
        placeholder="Nom de votre collectif"
        required={required}
      />
    </FormField>
  );
};
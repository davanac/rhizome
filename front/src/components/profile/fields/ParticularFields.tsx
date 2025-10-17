import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/signup/FormField";
import { Enterprise } from "../types/Enterprise";

interface ParticularFieldsProps {
  firstName: string;
  lastName: string;
  expertise: string;
  collectif: string;
  enterprises: Enterprise[];
  required?: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export const ParticularFields = ({
  firstName,
  lastName,
  expertise,
  collectif,
  enterprises,
  required = false,
  onFieldChange,
}: ParticularFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Prénom" required={true}>
          <Input
            value={firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            required={true}
          />
        </FormField>
        <FormField label="Nom" required={true}>
          <Input
            value={lastName}
            onChange={(e) => onFieldChange("lastName", e.target.value)}
            required={true}
          />
        </FormField>
      </div>

      {
        /** ------------------ cmt 448923 ------------------
        <FormField label="Collectif" required={required}>
        <Select
          value={collectif}
          onValueChange={(value) => onFieldChange("collectif", value)}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un collectif" />
          </SelectTrigger>
          <SelectContent>
            {enterprises.map((enterprise) => (
              <SelectItem key={enterprise.id} value={enterprise.collectif}>
                {enterprise.collectif}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
        *-------------------------------------------------*/
      }

      <FormField label="Expertise" required={true}>
        <Input
          value={expertise}
          onChange={(e) => onFieldChange("expertise", e.target.value)}
          placeholder="Votre domaine d'expertise"
          required={true}
        />
      </FormField>
    </>
  );
};
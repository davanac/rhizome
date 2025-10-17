import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/signup/FormField";

interface BioFieldProps {
  bio: string;
  accountType: string;
  required?: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export const BioField = ({
  bio,
  accountType,
  required = false,
  onFieldChange,
}: BioFieldProps) => {
  const maxLength = 300;
  const currentLength = bio?.length || 0;

  return (
    <div>
      <FormField 
        label={accountType === 'entreprise' ? "Description de l'entreprise" : "Bio"}
        required={required}
      >
        <div></div>
      </FormField>
      <div className="relative">
        <Textarea
          value={bio}
          onChange={(e) => onFieldChange("bio", e.target.value)}
          className="h-24"
          required={required}
          maxLength={maxLength}
        />
        <div className="text-sm text-muted-foreground text-right mt-1">
          {currentLength}/{maxLength}
        </div>
      </div>
    </div>
  );
};
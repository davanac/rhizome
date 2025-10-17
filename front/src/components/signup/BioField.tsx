/**
 * Component: BioField
 * Description: Text area field for user bio or company description.
 * Handles character limit and different placeholder text based on account type.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.bio - Current bio text
 * @param {string} props.accountType - Type of account ('entreprise' or other)
 * @param {Function} props.onChange - Handler for bio text changes
 * @returns {JSX.Element} Bio input field with character counter
 */
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./FormField";

interface BioFieldProps {
  bio: string;
  accountType: string;
  onChange: (value: string) => void;
}

export const BioField = ({ bio, accountType, onChange }: BioFieldProps) => {
  const label = accountType === 'entreprise' ? "Description de l'entreprise" : "Bio";
  
  return (
    <FormField label={label} required>
      <Textarea
        required
        value={bio}
        onChange={(e) => {
          const text = e.target.value;
          if (text.length <= 150) {
            onChange(text);
          }
        }}
        placeholder={accountType === 'entreprise' ? "Décrivez votre entreprise (150 caractères max)" : "Parlez-nous de vous (150 caractères max)"}
        className="h-24"
        maxLength={150}
      />
      <p className="text-xs text-gray-500 mt-1">
        {bio.length}/150 caractères
      </p>
    </FormField>
  );
};
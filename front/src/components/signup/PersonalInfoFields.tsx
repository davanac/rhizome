/**
 * Component: PersonalInfoFields
 * Description: Group of form fields for personal information.
 * Includes name, username, expertise, and company details.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.firstName - First name value
 * @param {string} props.lastName - Last name value
 * @param {string} props.username - Username value
 * @param {string} props.expertise - Expertise value
 * @param {string} props.entreprise - Company name value
 * @param {Function} props.onChange - Handler for field changes
 * @returns {JSX.Element} Personal information form section
 */
import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";
import { PersonalDetailsBlock } from "./PersonalDetailsBlock";

interface PersonalInfoFieldsProps {
  firstName: string;
  lastName: string;
  username: string;
  expertise: string;
  entreprise: string;
  onChange: (field: string, value: string) => void;
}

export const PersonalInfoFields = ({
  firstName,
  lastName,
  username,
  expertise,
  entreprise,
  onChange
}: PersonalInfoFieldsProps) => {
  return (
    <div className="space-y-6">
      <PersonalDetailsBlock
        firstName={firstName}
        lastName={lastName}
        username={username}
        entreprise={entreprise}
        onChange={onChange}
      />

      <FormField label="Expertise" required>
        <Input
          required
          value={expertise}
          onChange={(e) => onChange('expertise', e.target.value)}
          placeholder="Votre domaine d'expertise"
        />
      </FormField>
    </div>
  );
};
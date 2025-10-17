import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";
import { Card } from "@/components/ui/card";

interface PersonalDetailsBlockProps {
  firstName: string;
  lastName: string;
  username: string;
  entreprise: string;
  onChange: (field: string, value: string) => void;
}

export const PersonalDetailsBlock = ({
  firstName,
  lastName,
  username,
  entreprise,
  onChange
}: PersonalDetailsBlockProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Prénom" required>
            <Input
              required
              value={firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              placeholder="Votre prénom"
            />
          </FormField>

          <FormField label="Nom" required>
            <Input
              required
              value={lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder="Votre nom"
            />
          </FormField>
        </div>

        <FormField label="Nom d'utilisateur" required>
          <Input
            required
            value={username}
            onChange={(e) => onChange('username', e.target.value)}
            placeholder="Votre nom d'utilisateur"
          />
        </FormField>

        <FormField label="Entreprise">
          <Input
            value={entreprise}
            onChange={(e) => onChange('entreprise', e.target.value)}
            placeholder="Votre entreprise actuelle"
          />
        </FormField>
      </div>
    </Card>
  );
};
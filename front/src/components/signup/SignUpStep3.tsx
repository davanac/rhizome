/**
 * Component: SignUpStep3
 * Description: Third step of signup process for avatar selection.
 * Handles avatar upload and preview.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.avatarUrl - Current avatar URL
 * @param {Function} props.onChange - Handler for avatar changes
 * @param {Function} props.onBack - Handler for going back to previous step
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Avatar selection step
 */
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "../profile/ImageUploadField";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SignUpStep3Props {
  avatarUrl: string;
  onChange: (field: string, value: string) => void;
  onBack: () => void;
  loading: boolean;
}

export const SignUpStep3 = ({ 
  avatarUrl,
  onChange,
  onBack,
  loading
}: SignUpStep3Props) => {
  return (
    <div className="space-y-6">
      <ImageUploadField
        value={avatarUrl}
        onChange={(value) => onChange('avatarUrl', value)}
        type="avatar"
        buttonText="Choisir un avatar"
      />

      {avatarUrl && (
        <div className="flex justify-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt="Avatar preview" />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </div>
      )}

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
          type="submit" 
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Création en cours..." : "Créer mon profil"}
        </Button>
      </div>
    </div>
  );
};
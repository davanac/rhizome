import { Input } from "@/components/ui/input";
import { GlobeIcon } from "lucide-react";

interface SocialLinksSectionProps {
  linkedin: string;
  github: string;
  youtube: string;
  spotify: string;
  instagram: string;
  facebook: string;
  website: string;
  onFieldChange: (field: string, value: string) => void;
  fieldErrors?: Record<string, string>;
}

export const SocialLinksSection = ({
  linkedin,
  github,
  youtube,
  spotify,
  instagram,
  facebook,
  website,
  onFieldChange,
  fieldErrors = {},
}: SocialLinksSectionProps) => {
  const renderFieldWithError = (
    fieldName: string,
    value: string,
    placeholder: string
  ) => (
    <div className="space-y-1">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onFieldChange(fieldName, e.target.value)}
        className={fieldErrors[fieldName] ? "border-red-500 focus:ring-red-500" : ""}
      />
      {fieldErrors[fieldName] && (
        <p className="text-sm text-red-500">{fieldErrors[fieldName]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Réseaux sociaux</h3>
      <div className="space-y-3">
        {renderFieldWithError("website", website, "Site internet")}
        {renderFieldWithError("linkedin", linkedin, "LinkedIn URL")}
        {renderFieldWithError("github", github, "GitHub URL")}
        {renderFieldWithError("youtube", youtube, "YouTube URL")}
        {renderFieldWithError("spotify", spotify, "Spotify URL")}
        {renderFieldWithError("instagram", instagram, "Instagram URL")}
        {renderFieldWithError("facebook", facebook, "Facebook URL")}
      </div>
    </div>
  );
};
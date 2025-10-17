import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";

interface UploadButtonProps {
  uploading: boolean;
  type: "avatar" | "banner" | "nft";
  onClick: () => void;
  text?: string;
}

export const UploadButton = ({ uploading, type, onClick, text }: UploadButtonProps) => {
  const defaultText = type === 'avatar' ? "Modifier l'avatar" : type === 'nft' ? "Modifier l'image du NFT" : "Modifier la bannière";
  
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={uploading}
      className="w-full sm:w-auto"
    >
      {uploading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <ImageIcon className="mr-2 h-4 w-4" />
          {text || defaultText}
        </>
      )}
    </Button>
  );
};
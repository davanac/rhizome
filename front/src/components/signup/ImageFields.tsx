import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { FormField } from "./FormField";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload } from "lucide-react";

interface ImageFieldsProps {
  avatarUrl: string;
  bannerUrl: string;
  firstName: string;
  lastName: string;
  onAvatarChange: (value: string) => void;
  onBannerChange: (value: string) => void;
}

export const ImageFields = ({
  avatarUrl,
  bannerUrl,
  firstName,
  lastName,
  onAvatarChange,
  onBannerChange
}: ImageFieldsProps) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'avatar') {
            onAvatarChange(reader.result);
          } else {
            onBannerChange(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {bannerUrl && (
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img
            src={bannerUrl}
            alt="Banner"
            className="rounded-md object-cover w-full h-full"
          />
        </AspectRatio>
      )}
      
      <div className="flex justify-center">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            {firstName.charAt(0)}{lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      <FormField label="Image de bannière" required>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={bannerUrl}
              onChange={(e) => onBannerChange(e.target.value)}
              placeholder="https://exemple.com/banniere.jpg"
              className="flex-1"
            />
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e, 'banner')}
              />
              <Button type="button" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </FormField>

      <FormField label="Avatar" required>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              value={avatarUrl}
              onChange={(e) => onAvatarChange(e.target.value)}
              placeholder="https://exemple.com/avatar.jpg"
              className="flex-1"
            />
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e, 'avatar')}
              />
              <Button type="button" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </FormField>
    </div>
  );
};
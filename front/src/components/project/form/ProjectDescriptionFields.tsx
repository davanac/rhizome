import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProjectFormData } from "@/types/form";
import { ImageUploadField } from "../../profile/ImageUploadField";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProjectDescriptionFieldsProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  projectStatus?: number;
}

export const ProjectDescriptionFields = ({ formData, setFormData, projectStatus }: ProjectDescriptionFieldsProps) => {
  return (
    <>
      {
        /** ------------------ cmt 685732 ------------------
        <div className="space-y-2">
        <label className="text-sm font-medium">Image de couverture (URL)</label>
        <Input
          type="url"
          required
          value={formData.thumbnail}
          
          placeholder="URL de l'image de couverture"
        />
      </div>
        *-------------------------------------------------*/
      }

      <div className="space-y-4 ">
      <ImageUploadField
        label=""
        value={formData.thumbnail}
        //onChange={(value) => onFieldChange("bannerUrl", value)}
        onChange={(value) => setFormData({ ...formData, thumbnail: value })}
        type="banner"
      />

      {formData.thumbnail && (
        <AspectRatio ratio={16 / 6} className="bg-muted overflow-hidden rounded-lg">
          <img
            src={formData.thumbnail}
            alt="Banner preview"
            className="object-cover w-full h-full"
          />
        </AspectRatio>
      )}
    </div>
    <div className="space-y-4 w-[300px] h-[375px] mx-auto">
      {
        !(projectStatus === 4) && <ImageUploadField
        label=""
        value={formData.nftImg}
        //onChange={(value) => onFieldChange("bannerUrl", value)}
        onChange={(value) => setFormData({ ...formData, nftImg: value })}
        required={true}
        type="nft"
      />
        
      }

      {formData.nftImg && (
        <AspectRatio ratio={1 / 1} className="bg-muted overflow-hidden rounded-lg   w-[300px] h-[300px] mx-auto">
          <img
            src={formData.nftImg}
            alt="Banner preview"
            className="object-cover w-full h-full"
          />
        </AspectRatio>
      )}
    </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description détaillée du projet"
        />
      </div>
    </>
  );
};
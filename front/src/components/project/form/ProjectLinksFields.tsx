import { Input } from "@/components/ui/input";
import { ProjectFormData, ProjectLink } from "@/types/form";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

interface ProjectLinksFieldsProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
}

export const ProjectLinksFields = ({ formData, setFormData }: ProjectLinksFieldsProps) => {
  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...(prev.links || []), { url: "" }]
    }));
  };

  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, value: string) => {
    setFormData(prev => {
      const newLinks = [...prev.links];
      newLinks[index] = { url: value };
      return { ...prev, links: newLinks };
    });
  };

  return (
    <div className="space-y-4">
      {formData.links.map((link, index) => (
        <div key={index} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">
              Lien de présentation #{index + 1}
            </label>
            <Input
              type="url"
              value={link.url}
              onChange={(e) => updateLink(index, e.target.value)}
              placeholder={`URL de présentation #${index + 1}`}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="self-end"
            onClick={() => handleRemoveLink(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddLink}
        className="w-full flex items-center justify-center gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Ajouter un lien de présentation
      </Button>
    </div>
  );
};
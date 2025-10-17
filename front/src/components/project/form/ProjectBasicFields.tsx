import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectFormData } from "@/types/form";

interface ProjectBasicFieldsProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
}

export const ProjectBasicFields = ({ formData, setFormData }: ProjectBasicFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Titre</label>
        <Input
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Entrez le titre du projet"
        />
      </div>
      {
        /** ------------------ cmt 550081 ------------------
        <div className="space-y-2">
        <label className="text-sm font-medium">Catégorie</label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Formation/Recrutement">Formation/Recrutement</SelectItem>
            <SelectItem value="Stratégie/Management">Stratégie/Management</SelectItem>
            <SelectItem value="Développement/Workflow">Développement/Workflow</SelectItem>
            <SelectItem value="Communication/Relations Publiques">Communication/Relations Publiques</SelectItem>
            <SelectItem value="Rédaction/Production audiovisuelle">Rédaction/Production audiovisuelle</SelectItem>
          </SelectContent>
        </Select>
      </div>
        *-------------------------------------------------*/
      }
      <div className="space-y-2">
        <label className="text-sm font-medium">Date de publication</label>
        <Input
          type="date"
          required
          value={formData.dueDate.split("T")[0]}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>
    </div>
  );
};
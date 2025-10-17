/**
 * Component: ProjectFormFields
 * Description: Collection of form fields for project creation/editing.
 * Organizes project form into logical sections.
 * 
 * @param {Object} props - Component properties
 * @param {ProjectFormData} props.formData - Current form data
 * @param {Function} props.setFormData - Handler for updating form data
 * @returns {JSX.Element} Project form fields group
 */
import { ProjectFormData } from "@/types/form";
import { ProjectBasicFields } from "./form/ProjectBasicFields";
import { ProjectDescriptionFields } from "./form/ProjectDescriptionFields";
import { ProjectLinksFields } from "./form/ProjectLinksFields";
import { ProjectClientFields } from "./form/ProjectClientFields";

interface ProjectFormFieldsProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  projectStatus?: number;
}



export const ProjectFormFields = ({ formData, setFormData, projectStatus }: ProjectFormFieldsProps) => {

  console.log('=== projectStatus === ProjectFormFields.tsx === key: 614382 ===');
  console.dir(projectStatus, { depth: null, colors: true })
  console.log('=================================');

  return (
    <>
      <ProjectBasicFields formData={formData} setFormData={setFormData}  />
      <ProjectDescriptionFields formData={formData} setFormData={setFormData} projectStatus={projectStatus} />
      <ProjectLinksFields formData={formData} setFormData={setFormData} />
      <ProjectClientFields formData={formData} setFormData={setFormData} projectStatus={projectStatus} />
    </>
  );
};
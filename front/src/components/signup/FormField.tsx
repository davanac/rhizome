interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

/**
 * Component: FormField
 * Description: Reusable form field wrapper with label and required indicator.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.label - Field label text
 * @param {boolean} [props.required] - Whether the field is required
 * @param {React.ReactNode} props.children - Field input component
 * @returns {JSX.Element} Labeled form field container
 */
export const FormField = ({ label, required, children }: FormFieldProps) => (
  <div>
    <label className="text-sm font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

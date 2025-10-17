/**
 * Component: SocialInput
 * Description: Input field for social media links with icon.
 * 
 * @param {Object} props - Component properties
 * @param {LucideIcon} props.icon - Icon component to display
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Handler for value changes
 * @param {string} props.placeholder - Input placeholder text
 * @returns {JSX.Element} Social media input field with icon
 */
import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";

interface SocialInputProps {
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const SocialInput = ({
  icon: Icon,
  value,
  onChange,
  placeholder
}: SocialInputProps) => (
  <div className="relative">
    <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
    <Input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-10"
    />
  </div>
);
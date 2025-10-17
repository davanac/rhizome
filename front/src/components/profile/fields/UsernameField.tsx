import { useState, useEffect } from "react";
import { FormField } from "@/components/signup/FormField";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {useSession} from "@/hooks/useSession";

interface UsernameFieldProps {
  username: string;
  onFieldChange: (field: string, value: string) => void;
}

export const UsernameField = ({ username, onFieldChange }: UsernameFieldProps) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [inputValue, setInputValue] = useState(username);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const {session,getCurrentProfile} = useSession();

  const checkUsername = async (newUsername: string) => {
    //return;
    if (newUsername === username) return true; // No change
    //setIsChecking(true);
    return true;
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout to check username after user stops typing
    const newTimeoutId = setTimeout(async () => {
      const isValid = await checkUsername(value);
      if (isValid) {
        onFieldChange("username", value);
      }
    }, 500); // Wait 500ms after user stops typing

    setTimeoutId(newTimeoutId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <FormField label="Nom d'utilisateur" required>
      <Input
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Votre nom d'utilisateur"
        disabled={isChecking}
        required
      />
    </FormField>
  );
};
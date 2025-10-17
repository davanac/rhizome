import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { AuthService } from "../auth.service";
import * as authApi from "@/api/auth";
import * as profilesApi from "@/api/profiles";

/**
 * Hook that provides AuthService instance with injected dependencies
 * Enables dependency injection pattern for better testability
 */
export const useAuthService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const authService = useMemo(() => {
    const dependencies = {
      authApi,
      profilesApi,
      router: { navigate },
      toast,
    };

    return new AuthService(dependencies);
  }, [navigate, toast]);

  return authService;
};
import { useMemo } from "react";
import { ProjectService } from "../project.service";
import { useAuthService } from "./useAuthService";
import * as projectsApi from "@/api/projects";

/**
 * Hook that provides ProjectService instance with injected dependencies
 * Enables dependency injection pattern for better testability
 */
export const useProjectService = () => {
  const authService = useAuthService();

  const projectService = useMemo(() => {
    const dependencies = {
      projectsApi,
      authService,
    };

    return new ProjectService(dependencies);
  }, [authService]);

  return projectService;
};
import { useMemo } from "react";
import { NetworkService } from "../network.service";
import * as networkApi from "@/api/network";

/**
 * Hook that provides NetworkService instance with injected dependencies
 * Enables dependency injection pattern for better testability
 */
export const useNetworkService = () => {
  const networkService = useMemo(() => {
    const dependencies = {
      networkApi,
    };

    return new NetworkService(dependencies);
  }, []);

  return networkService;
};
/**
 * Custom Hook: useNetworkData
 * Description: Fetches and processes network visualization data using NetworkService
 *
 * This hook provides network graph data for D3.js visualization by:
 * 1. Fetching project data from the API
 * 2. Transforming profiles into network nodes
 * 3. Creating links between collaborators
 * 4. Aggregating collaboration counts
 *
 * @returns {Object} An object containing:
 *   - data (Object | undefined): The processed network data containing:
 *     - nodes (NetworkNode[]): Array of network nodes representing users
 *     - links (NetworkLink[]): Array of connections between users
 *   - isLoading (boolean): Loading state of the data fetch
 *   - error (Error | null): Any error that occurred during data fetch
 */
import { useQuery } from "@tanstack/react-query";
import { useNetworkService } from "@/services";

export const useNetworkData = () => {
  const networkService = useNetworkService();

  return useQuery({
    queryKey: ["participant-network"],
    queryFn: async () => {
      try {
        const networkData = await networkService.processNetworkData();
        return networkData;
      } catch (error) {
        console.error('Error fetching network data:', error);
        throw error;
      }
    },
  });
};
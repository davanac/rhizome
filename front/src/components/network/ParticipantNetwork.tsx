/**
 * Component: ParticipantNetwork
 * Description: Container component for the network visualization.
 * Manages data loading and displays the network chart.
 * 
 * @returns {JSX.Element} Network visualization container with loading states
 */
import { useQuery } from "@tanstack/react-query";
import { NetworkChart } from "./NetworkChart";
import { Card } from "@/components/ui/card";
import { useNetworkData } from "@/hooks/useNetworkData.ts";

export const ParticipantNetwork = () => {
  const { data: networkData, isLoading } = useNetworkData();

  console.log('=== networkData === ParticipantNetwork.tsx === key: 127533 ===');
  console.dir(networkData, { depth: null, colors: true })
  console.log('=================================');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement du réseau...</p>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Erreur de chargement du réseau...</p>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Réseau des collaborateur.ice.s</h2>
      <div className="h-[400px] w-full max-h-[50vh]">
        <NetworkChart data={networkData} />
      </div>
    </Card>
  );
};
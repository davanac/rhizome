/**
 * Component: ParticipantNetwork
 * Description: Container component for the network visualization.
 * Manages data loading and displays the network chart.
 *
 * @returns {JSX.Element} Network visualization container with loading states
 */
import { useState } from "react";
import { NetworkChart } from "./NetworkChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useNetworkData } from "@/hooks/useNetworkData.ts";
import { Maximize2 } from "lucide-react";

export const ParticipantNetwork = () => {
  const { data: networkData, isLoading } = useNetworkData();
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <>
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4">Réseau des collaborateur.ice.s</h2>
        <div className="relative h-[400px] w-full max-h-[50vh]">
          <NetworkChart data={networkData} />
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
            onClick={() => setIsFullscreen(true)}
            title="Afficher en plein écran"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-4">
          <h2 className="text-2xl font-bold mb-2">Réseau des collaborateur.ice.s</h2>
          <div className="h-[calc(90vh-80px)] w-full">
            <NetworkChart data={networkData} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
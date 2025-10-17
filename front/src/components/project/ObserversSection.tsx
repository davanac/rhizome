/**
 * Component: ParticipantsSection
 * Description: Section for managing all project participants.
 * Handles adding, removing, and updating participant information.
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.participants - List of project participants
 * @param {Function} props.setParticipants - Handler for updating participants list
 * @param {number} props.teamLeaderContribution - Team leader's contribution percentage
 * @param {Function} props.setTeamLeaderContribution - Handler for updating team leader contribution
 * @param {string} props.teamLeaderContributionDescription - Description of team leader's contribution
 * @param {Function} props.setTeamLeaderContributionDescription - Handler for updating contribution description
 * @param {string} [props.teamLeaderId] - ID of the team leader
 * @returns {JSX.Element} Participants management section
 */
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TeamLeaderForm } from "./TeamLeaderForm";
import { ObserverForm } from "./ObserverForm";
import { useToast } from "@/components/ui/use-toast";

interface ObserversSectionProps {
  observers: Array<{
    profile: string;
    contribution: number;
    contributionDescription: string;
  }>;
  setObservers: React.Dispatch<React.SetStateAction<Array<{
    profile: string;
    contribution: number;
    contributionDescription: string;
  }>>>;
  projectStatus?:number;
}

export const ObserversSection = ({
  observers,
  setObservers,
  projectStatus
}: ObserversSectionProps) => {
  const { toast } = useToast();


  const handleAddObserver = () => {
    setObservers([...observers, { profile: "", contribution: 0, contributionDescription: "" }]);
  };

  const handleRemoveObserver = (index: number) => {
    setObservers(observers.filter((_, i) => i !== index));
  };

  const handleObserverChange = (index: number, field: 'profile' | 'contribution' | 'contributionDescription', value: string | number) => {
    // Validate profile ID before updating
    if (field === 'profile' && typeof value === 'string' && !value.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un participant valide",
        variant: "destructive",
      });
      return;
    }

    const newObservers = [...observers];
    newObservers[index] = {
      ...newObservers[index],
      [field]: value
    };
    setObservers(newObservers);
  };

  if(!projectStatus) {
    projectStatus = 1;
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
     

      {observers.map((participant, index) => (
        <ObserverForm
          key={index}
          index={index}
          participant={participant}
          onRemove={() => handleRemoveObserver(index)}
          onChange={(field, value) => handleObserverChange(index, field, value)}
          existingObservers={observers.map(p => p.profile).filter((_, i) => i !== index)}
        />
      ))}

      {
        projectStatus == 1 && <div className="flex justify-between items-center pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddObserver}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter un observateur
        </Button>
      </div>
      }
    </div>
  );
};
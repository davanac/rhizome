/**
 * Component: ParticipantForm
 * Description: Form for managing project participant information.
 * Handles participant details, contributions, and role assignments.
 * 
 * @param {Object} props - Component properties
 * @param {number} props.index - Participant index in the list
 * @param {Object} props.participant - Participant data
 * @param {Function} props.onRemove - Handler for removing participant
 * @param {Function} props.onChange - Handler for participant data changes
 * @param {string[]} props.existingParticipants - List of existing participant IDs
 * @param {string} [props.teamLeaderId] - ID of the team leader
 * @returns {JSX.Element} Participant form section
 */
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MinusCircle } from "lucide-react";
import { ParticipantSearch } from "./ParticipantSearch";

interface ObserverFormProps {
  index: number;
  participant: {
    profile: string;
    contribution: number;
    contributionDescription: string;
  };
  onRemove: () => void;
  onChange: (field: 'profile' | 'contribution' | 'contributionDescription', value: string | number) => void;
  existingObservers: string[];
  teamLeaderId?: string;
}

export const ObserverForm = ({
  index,
  participant,
  onRemove,
  onChange,
  existingObservers,
  teamLeaderId,
}: ObserverFormProps) => {
  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Observateur {index + 1}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ParticipantSearch
          value={participant.profile}
          onSelect={(profileId) => {
            onChange('profile', profileId);
          }}
          existingParticipants={existingObservers}
          teamLeaderId={teamLeaderId}
          isObserver={true}
        />
      </div>
    </div>
  );
};
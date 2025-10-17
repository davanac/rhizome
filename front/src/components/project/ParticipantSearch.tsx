/**
 * Component: ParticipantSearch
 * Description: Searchable dropdown for selecting project participants.
 * Filters out existing participants and team leader from options.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.value - Selected participant ID
 * @param {Function} props.onSelect - Handler for participant selection
 * @param {string[]} props.existingParticipants - List of existing participant IDs
 * @param {string} [props.teamLeaderId] - ID of the team leader
 * @returns {JSX.Element} Participant search dropdown
 */
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {useSession} from "@/hooks/useSession";

import { getAllProfiles } from "@/api/profiles"
import { getProfileDisplayName } from "@/utils/profileUtils";

interface ParticipantSearchProps {
  value: string;
  onSelect: (profileId: string) => void;
  existingParticipants: string[];
  teamLeaderId?: string;
  isObserver?;
}

export const ParticipantSearch = ({ value, onSelect, existingParticipants, teamLeaderId, isObserver }: ParticipantSearchProps) => {
  const [open, setOpen] = useState(false);
  const {session, currentProfile, user} = useSession();


  const   returnedProfiles  = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      // Filter out team leader and existing participants
      const response = await getAllProfiles();


      if (response?.success === false) {
        return [];
      }
      
      // Extract profiles array from response
      const loadedProfiles = response?.profiles || [];
      
      const excludedProfiles = [...existingParticipants];
      if (teamLeaderId) {
        excludedProfiles.push(teamLeaderId);
      }

      const filteredProfiles = loadedProfiles.filter(
        (profile) =>
          profile.profile_type !== 'collectif' && // Only individual profiles
          !existingParticipants.includes(profile.id) &&
          profile.id !== currentProfile.id
      )


      return {
        filteredProfiles: filteredProfiles?.length > 0 ? filteredProfiles : [],
        loadedProfiles: loadedProfiles?.length > 0 ? loadedProfiles : []
      };

    },
  });



  let profiles= [];
  let allProfiles= [];
  if (Array.isArray(returnedProfiles?.data)) {
    //profiles = returnedProfiles.data;
  } else if (returnedProfiles?.data?.filteredProfiles) {
    profiles = returnedProfiles.data.filteredProfiles;
  }
  if (Array.isArray(returnedProfiles?.data)) {
    //allProfiles = returnedProfiles.data;
  } else if (returnedProfiles?.data?.loadedProfiles) {
    allProfiles = returnedProfiles.data.loadedProfiles;
  }

  const handleSelect = (profileId: string) => {
    onSelect(profileId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {value ?
            getProfileDisplayName(allProfiles?.find(p => p.id === value))
            : (!isObserver ? "Sélectionner un participant" : "Sélectionner un observateur")}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command
          filter={(value, search) => {
            const normalizedValue = value.toLowerCase();
            const normalizedSearch = search.toLowerCase();
            return normalizedValue.includes(normalizedSearch) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={!isObserver?"Rechercher un participant...":"Rechercher un observateur..."} />
          <CommandEmpty>Aucun participant trouvé.</CommandEmpty>
          <CommandGroup>
            {profiles?.map((profile) => (
              <CommandItem
                key={profile.id}
                value={getProfileDisplayName(profile)}
                onSelect={() => handleSelect(profile.id)}
              >
                {getProfileDisplayName(profile)}
                {profile.expertise && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({profile.expertise})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
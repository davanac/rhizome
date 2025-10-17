import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ProjectFormData } from "@/types/form";
import { useQuery } from "@tanstack/react-query";
import { getAllProfiles } from "@/api/profiles"
import { profile } from "console";
import {useSession} from "@/hooks/useSession";
import { getProfileDisplayName } from "@/utils/profileUtils";
import { Search } from "lucide-react";
import { useState } from "react";

interface ProjectClientFieldsProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  projectStatus?: number;
  
}

export const ProjectClientFields = ({ formData, setFormData,projectStatus }: ProjectClientFieldsProps) => {
  const {session, currentProfile, user} = useSession();
  const [open, setOpen] = useState(false);
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['collectif-profiles'],
    queryFn: async () => {
      const profiles = await getAllProfiles();



      

      if (profiles?.success === false) {
        return [];
      }
      
      // Extract profiles array from response
      const loadedProfiles = profiles?.profiles || [];
      
      const filteredProfiles = loadedProfiles.filter(
        (profile) =>
          (profile.profile_type === 'collectif' || profile.profile_type === 'individual') && profile.id !== currentProfile.id
      )
        

      return filteredProfiles?.length > 0 ? filteredProfiles : [];
    },
  });

  if(!projectStatus) {
    projectStatus = 1;
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Client</label>
        {
          projectStatus === 1 && <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {formData.client ?
                  getProfileDisplayName(profiles?.find(p => p.id === formData.client))
                  : (isLoading ? "Chargement..." : "Sélectionnez un client")}
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
                <CommandInput placeholder="Rechercher un client..." />
                <CommandEmpty>
                  {isLoading ? "Chargement des clients..." : "Aucun client trouvé."}
                </CommandEmpty>
                <CommandGroup>
                  {profiles && profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <CommandItem
                        key={profile.id}
                        value={getProfileDisplayName(profile)}
                        onSelect={() => {
                          setFormData({ ...formData, client: profile.id });
                          setOpen(false);
                        }}
                      >
                        {getProfileDisplayName(profile)}
                        {profile.expertise && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({profile.expertise})
                          </span>
                        )}
                      </CommandItem>
                    ))
                  ) : (
                    !isLoading && <CommandItem disabled>
                      Aucun client disponible
                    </CommandItem>
                  )}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        }
        {
          projectStatus !== 1 && <div className="text-lg font-medium">
          {
            profiles && profiles.length > 0 && profiles.find((profile) => profile.id === formData.client) 
              ? getProfileDisplayName(profiles.find((profile) => profile.id === formData.client))
              : formData.client
          }
        </div>
        }
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Témoignage client</label>
        {
        [1,4].includes(projectStatus)  && <Textarea
          value={formData.testimonial}
          onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
          placeholder="Témoignage du client (optionnel)"
        />
        }
        {
          ![1,4].includes(projectStatus) && <div className="text-lg font-medium">
          {formData.testimonial}
          </div>
        }
      </div>
    </>
  );
};
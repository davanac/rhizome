import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ParticipantsSection } from "./ParticipantsSection";
import { ObserversSection } from "./ObserversSection";
import { useToast } from "@/components/ui/use-toast";
import Config from "@/config/config";
import { ProjectFormFields } from "./ProjectFormFields";
import { ProjectFormData } from "@/types/form";
import {useSession} from "@/hooks/useSession";

interface ProjectFormProps {
  onSubmit: (project) => void;
  onCancel: () => void;
  initialData?: ProjectFormData;
  initialParticipants?: Array<{
    profile: string;
    contribution: number;
    contributionDescription: string;
  }>;
  initialObservers?: Array<{
    profile: string;
    contribution: number;
    contributionDescription: string;
  }>;
  initialTeamLeaderContribution?: number;
  initialTeamLeaderContributionDescription?: string;
}

export const ProjectForm = ({ 
  onSubmit, 
  onCancel,
  initialData,
  initialParticipants = [],
  initialObservers = [],
  initialTeamLeaderContribution = Config.TEAM_LEADER_CONTRIBUTION,
  initialTeamLeaderContributionDescription = "",
}: ProjectFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(initialData || {
    title: "",
    description: "",
    dueDate: "",
    thumbnail: "",
    category: "",
    client: "",
    testimonial: "",
    links: []
  });
  const {session, currentProfile, user} = useSession();

  const [participants, setParticipants] = useState<Array<{
    profile: string;
    contribution: number;
    contributionDescription: string;
  }>>(initialParticipants);

  const [observers, setObservers] = useState<Array<{
    profile: string;
    contribution: number;
    contributionDescription: string;
  }>>(initialObservers);

  const [teamLeaderContribution, setTeamLeaderContribution] = useState(initialTeamLeaderContribution);
  const [teamLeaderContributionDescription, setTeamLeaderContributionDescription] = useState(initialTeamLeaderContributionDescription);

  const validateContributions = () => {
    const total = teamLeaderContribution + participants.reduce((acc, curr) => acc + curr.contribution, 0);
    return total <= 100;
  };

  const validateParticipants = () => {
    return participants.every(p => p.profile && p.profile.trim() !== "");
  };

  const validateObservers = () => {
    return observers.every(p => p.profile && p.profile.trim() !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    console.log('=== user === ProjectForm.tsx === key: 641856 ===');
    console.dir(user, { depth: null, colors: true })
    console.log('================================='); 

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer un projet",
        variant: "destructive"
      });
      return;
    }

    if (!validateContributions()) {
      toast({
        title: "Erreur",
        description: "Le total des contributions ne peut pas dépasser 100%",
        variant: "destructive"
      });
      return;
    }

    if (!validateParticipants()) {
      toast({
        title: "Erreur",
        description: "Tous les participants doivent être sélectionnés",
        variant: "destructive"
      });
      return;
    }

    if (!validateObservers()) {
      toast({
        title: "Erreur",
        description: "Tous les participants doivent être sélectionnés",
        variant: "destructive"
      });
      return;
    }

    console.log('=== observers === ProjectForm.tsx === key: 012244 ===');
    console.dir(observers, { depth: null, colors: true })
    console.log('=================================');



    setIsSubmitting(true);

    try {
      const projectData = {
        ...formData,
        author: {
          contribution: teamLeaderContribution,
          contributionDescription: teamLeaderContributionDescription
        },
        participants: participants.filter(p => p.profile && p.profile.trim() !== "").map(p => ({
          profile: p.profile,
          contribution: p.contribution,
          contributionDescription: p.contributionDescription
        })),
        observers: observers.filter(p => p.profile && p.profile.trim() !== "").map(p => ({
          profile: p.profile,
          contribution: 0,
          contributionDescription: ""
        })),
        links: formData.links.filter(link => link.url && link.url.trim() !== "")
      };

      await onSubmit(projectData);
      setIsSubmitting(false);
    } catch (error) {
      console.log('=== error === ProjectForm.tsx === key: 429903 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
      setIsSubmitting(false);
    }
  };

  console.log('=== initialData === ProjectForm.tsx === key: 893915 ===');
  console.dir(initialData, { depth: null, colors: true })
  console.dir(initialData?.statusId, { depth: null, colors: true })
  console.log('=================================');

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {initialData ? "Modifier le Projet" : "Créer un Nouveau Projet"}
        </h1>
        <Button variant="outline" onClick={onCancel} type="button">Retour</Button>
      </div>

      <ProjectFormFields formData={formData} setFormData={setFormData}  projectStatus={initialData?.statusId} />

{
  (!initialData || initialData?.statusId!=4) && <ParticipantsSection
  participants={participants}
  setParticipants={setParticipants}
  teamLeaderContribution={teamLeaderContribution}
  setTeamLeaderContribution={setTeamLeaderContribution}
  teamLeaderContributionDescription={teamLeaderContributionDescription}
  setTeamLeaderContributionDescription={setTeamLeaderContributionDescription}
  projectStatus={initialData?.statusId}
/>
}

{
  (!initialData || initialData?.statusId!=4)  && <ObserversSection
  observers={observers}
  setObservers={setObservers}
  projectStatus={initialData?.statusId}
/>
}

      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full"
      >
        {isSubmitting ? "Enregistrement en cours..." : (initialData ? "Enregistrer les Modifications" : "Créer le Projet")}
      </Button>
    </form>
  );
};
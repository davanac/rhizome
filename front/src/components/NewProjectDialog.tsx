/**
 * Component: NewProjectDialog
 * Description: Dialog for creating new projects with form validation and submission.
 * Handles project creation workflow and user feedback.
 * 
 * @returns {JSX.Element} Project creation dialog with form
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProjectForm } from "./project/ProjectForm";
import { useQueryClient } from "@tanstack/react-query";
import {updateProject,createProject} from "@/api/projects";
import { generateProjectSlug } from "@/utils/slugify";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {useSession} from "@/hooks/useSession";
import { useParams } from "react-router-dom"; 
import Config from "@config";

export const NewProjectDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {session, currentProfile, user} = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { idWithSlug } = useParams();

  const handleProjectCreate = async (projectData) => {
    if (isSubmitting) return;

    console.log('=== projectData === NewProjectDialog.tsx === key: 711023 ===');
    console.dir(projectData, { depth: null, colors: true })
    console.log('=================================');
    
    try {
      setIsSubmitting(true);
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour modifier un projet",
          variant: "destructive"
        });
        return;
      }

      // Ensure links is an array of objects with url property
      const links = Array.isArray(projectData.links) 
        ? projectData.links.filter((link) => link && typeof link.url === 'string' && link.url.trim() !== "")
        : [];

      const projectToCreate = {
        ...projectData,
        links,
        author: {
          profile: currentProfile?.id || user.primaryProfile?.id,
          id: user.userId || user.id,
          name: user.name || `${user.primaryProfile?.firstName || ''} ${user.primaryProfile?.lastName || ''}`.trim() || user.email?.split('@')[0] || '',
          username: user.primaryProfile?.username || user.email?.split('@')[0] || '',
          avatar: user.primaryProfile?.avatarUrl || user.profileImage || '',
          expertise: user.primaryProfile?.expertise || '',
          role: "Team Leader" as const,
          contribution: projectData.author?.contribution || 0,
          contributionDescription: projectData.author?.contributionDescription || ""
        },
        participants: projectData.participants || [],
        url: Config.ENDPOINT_URL.replace(/\/$/, '') + '/project/',
        slug:generateProjectSlug(projectData.title, ""),
      };

      const newProject = await createProject(projectToCreate);
      const slug = generateProjectSlug(newProject.title, newProject.id);

      console.log('=== newProject === NewProjectDialog.tsx === key: 920386 ===');
      console.dir(newProject, { depth: null, colors: true })
      console.log('=================================');

      newProject.url = Config.ENDPOINT_URL.replace(/\/$/, '') + '/project/' + slug;

      
      /** ------------------ cmt 225732 ------------------
      queryClient.setQueryData(['userProjects', user.id], (oldData) => {
        if (!oldData) return [newProject];
        return [...oldData, newProject];
      });
      *-------------------------------------------------*/

      setIsOpen(false);
      toast({
        title: "Succès",
        description: "Projet créé avec succès !",
      });
      
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du projet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
        <ProjectForm
          onSubmit={handleProjectCreate}
          onCancel={() => setIsOpen(false)}
        />
      </div>
    );
  }

  return (
    <Button 
      className="gap-2 bg-[#2a9d8f] hover:bg-[#2a9d8f]/90" 
      onClick={() => setIsOpen(true)}
    >
      <PlusCircle className="h-5 w-5" />
      Nouveau Projet
    </Button>
  );
};
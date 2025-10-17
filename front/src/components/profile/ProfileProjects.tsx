import { useEffect, useState, useMemo } from "react";
import { Project } from "@/types/project";
import { fetchUserProjects } from "@/utils/projectQueries";
import { ProjectCard } from "@/components/ProjectCard";
import { useToast } from "@/components/ui/use-toast";
import {getAllProjectsByProfileID} from "@/api/projects";
import {useSession} from "@/hooks/useSession";

interface ProfileProjectsProps {
  username: string;
  user: any;
}

export const ProfileProjects = ({ username, user }: ProfileProjectsProps) => {

  const {session} = useSession();
  const [proj, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadProjects = async () => {
      // Check if user.id exists before making API call
      if (!user || !user.id) {
        console.error('ProfileProjects: user.id is missing:', { user });
        setLoading(false);
        return;
      }

      try {
        console.log('ProfileProjects: Fetching projects for user.id:', user.id);
        const {projects,error} = await getAllProjectsByProfileID(user.id);


        const allProjects = [
          ...(projects.teamLeaderProjects || []),
          ...(projects.observerProjects || []),
          ...(projects.contributorProjects || [])
        ];
  
        setProjects(allProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [username,user, toast]);

  const categorizedProjects = useMemo(() => {
    if (!proj || proj.length === 0) {
      return {
        inProgress: [],
        delivered: [],
        frozen: [],
        completed: []
      };
    }

    return {
      inProgress: proj.filter(project => project.status_id === 1),
      delivered: proj.filter(project => project.status_id === 2),
      frozen: proj.filter(project => project.status_id === 3),
      completed: proj.filter(project => project.status_id === 4)
    };
  }, [proj]);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-gray-600">Chargement des projets...</p>
      </div>
    );
  }

  if (!proj.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Aucun projet trouvé</p>
      </div>
    );
  }

  const ProjectSection = ({ title, projects: sectionProjects }) => (
    <>
      {sectionProjects.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">{title} ({sectionProjects.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectionProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">
        Projets ({proj.length})
      </h2>
      
      <ProjectSection
        title="Projets en cours"
        projects={categorizedProjects.inProgress}
      />
      
      <ProjectSection
        title="Projets livrés"
        projects={categorizedProjects.delivered}
      />
      
      <ProjectSection
        title="Projets en attente de signatures"
        projects={categorizedProjects.frozen}
      />
      
      <ProjectSection
        title="Projets terminés"
        projects={categorizedProjects.completed}
      />
    </div>
  );
};
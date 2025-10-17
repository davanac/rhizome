
import { ProjectCard } from "@/components/ProjectCard";
import { useQuery } from "@tanstack/react-query";
import { transformAndDeduplicateProjects } from "@/utils/projectDataTransformers";
import {getAllProjectsByProfileID} from "@/api/projects";

interface UserProjectGalleryProps {
  userId: string;
}

export const UserProjectGallery = ({ userId }: UserProjectGalleryProps) => {
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['userProjects', userId],
    queryFn: async () => {

      const resp = await getAllProjectsByProfileID(userId);


      // Combine and transform all projects
      const allProjects = [
        ...(resp.projects.teamLeaderProjects || []),
        ...(resp.projects.observerProjects || []),
        ...(resp.projects.contributorProjects || [])
      ];



      return transformAndDeduplicateProjects(allProjects);
    }
  });



  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des projets...</p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun projet trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
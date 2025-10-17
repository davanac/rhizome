import { useParams } from "react-router-dom";
import {useState, useEffect} from "react";
import { ProjectError } from "@/components/project/ProjectError";
import { ProjectContent } from "@/components/project/ProjectContent";
import { useNavigate } from "react-router-dom";
import {useSession} from "@/hooks/useSession";

import {getProjectById} from "@/api/projects";

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const {session, currentProfile} = useSession();
  const { idWithSlug } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProject = async () => {
      const projectResult = await getProjectById(idWithSlug);

      console.log('=== projectResult === ProjectDetails.tsx === key: 785039 ===');
      console.dir(projectResult, { depth: null, colors: true })
      console.log('=================================');

      if(projectResult.success === false){
        setError(projectResult);
        setIsLoading(false);
        return;
      }

      

      setProject(projectResult);
      setIsLoading(false);
    };

    fetchProject();
  },
  [idWithSlug]);

  if (error) {
    console.error('Project loading error:', error);
    return (
      <ProjectError 
        title="Une erreur est survenue lors du chargement du projet"
        description="Le projet n'a pas pu être chargé. Veuillez réessayer ultérieurement."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <ProjectError 
        title="Projet non trouvé"
        description="Le projet que vous recherchez n'existe pas ou a été supprimé."
      />
    );
  }

  console.log('=== project === ProjectDetails.tsx === key: 633437 ===');
  console.dir(project, { depth: null, colors: true })
  console.log('=================================');

  const isProjectCreator =( currentProfile)?.id === project.author.profile_id;
  const handleEditClick = () => {
    if (idWithSlug) {
      navigate(`/project/${idWithSlug}/edit`);
    }
  };

  

  return (
    <ProjectContent 
      project={project}
      isProjectCreator={isProjectCreator}
      onEditClick={handleEditClick}
      idWithSlug={idWithSlug || ''}
    />
  );
};

export default ProjectDetails;
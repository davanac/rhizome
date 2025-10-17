/**
 * Component: ProjectDetails
 * Description: Main component for displaying detailed project information.
 * Uses React Query for data fetching and caching, and React Router for navigation.
 * 
 * Technical choices:
 * - React Query: Handles server state, caching, and loading states
 * - React Router: For navigation and URL parameter handling
 * - Context API: For user authentication state
 */
import { useParams } from "react-router-dom"; // For accessing URL parameters
import { useProjectQuery } from "@/hooks/useProjectQuery"; // Custom hook for project data fetching
import { ProjectError } from "@/components/project/ProjectError"; // Error boundary component
import { ProjectContent } from "@/components/project/ProjectContent"; // Main content display
import { useNavigate } from "react-router-dom"; // For programmatic navigation
import {useSession} from "@/hooks/useSession";
import { extractIdFromSlug } from "@/utils/slugify";

const ProjectDetails = () => {
  // Extract project ID from URL parameters
  const { idWithSlug } = useParams();
  // Get current user for authorization checks
  const {session, getCurrentProfile} = useSession();
  // Hook for programmatic navigation
  const navigate = useNavigate();
  
  // Fetch project data using React Query
  // This provides automatic caching and revalidation
  const { data: project, isLoading, error } = useProjectQuery(idWithSlug);
  // Error handling with dedicated error component
  if (error) {
    console.error('Project loading error:', error);
    return (
      <ProjectError 
        title="Une erreur est survenue lors du chargement du projet"
        description="Le projet n'a pas pu être chargé. Veuillez réessayer ultérieurement."
      />
    );
  }

  // Loading state handling
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
        </div>
      </div>
    );
  }

  // Handle case where project is not found
  if (!project) {
    return (
      <ProjectError 
        title="Projet non trouvé"
        description="Le projet que vous recherchez n'existe pas ou a été supprimé."
      />
    );
  }

  // Check if current user is the project creator
  const isProjectCreator = (getCurrentProfile())?.id === project.author.id;
  
  // Handler for edit button click
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
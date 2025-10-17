
import { ProjectCard } from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { transformDatabaseProject } from "@/utils/projectTransformers";
import { DatabaseProject } from "@/types/database";
import {getAllProjects} from "@/api/projects";
import {useState, useEffect} from "react";

export const ProjectGallery = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<DatabaseProject[] | null>([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
      const rawProjects = await getAllProjects()
      console.log('=== rawProjects === ProjectGallery.tsx === key: 710008 ===');
      console.dir(rawProjects, { depth: null, colors: true })
      console.log('=================================');
      if(rawProjects.success === false )
      {
        setError(
          {
            success: false,
            message: "Impossible de charger les projets",
            errorKey: 144532
          }
        )
        setProjects([]);

        
      }
      else
      {
        const getAllProjects = rawProjects.map((project: DatabaseProject) => transformDatabaseProject(project))||[];
        // Filter to only show certified projects (statusId === 4) on landing page
        const certifiedProjects = getAllProjects.filter(project => project.statusId === 4);
        setProjects(certifiedProjects);
        
      }
      } catch (error) {
        setError(error)
        setProjects([]);
      }
      finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);



      
      

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[500px] w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    console.log('=== error === ProjectGallery.tsx === key: 136492 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return (
      <Alert variant="destructive" className="mx-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Une erreur est survenue lors du chargement des projets.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Projets certifiés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};
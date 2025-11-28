import { useParams, useNavigate } from "react-router-dom";
import {useState, useEffect} from "react";
import { useToast } from "@/hooks/use-toast";
import { ProjectForm } from "@/components/project/ProjectForm";
import { EditProjectError } from "@/components/project/EditProjectError";
import { EditProjectLoading } from "@/components/project/EditProjectLoading";
import {useSession} from "@/hooks/useSession";
import {updateProject,createProject} from "@/api/projects";
import Config from "@config";
import { decodeHtmlEntities } from "@/utils/textUtils";

import {getProjectById} from "@/api/projects";

const EditProject = () => {
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const {session, currentProfile, user} = useSession();
  const { idWithSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  

  useEffect(() => {
    const fetchProject = async () => {
      const projectResult = await getProjectById(idWithSlug);



      if(projectResult.success === false){
        setError(projectResult);
        setIsLoading(false);
        return;
      }

      setProject(projectResult);
      setIsLoading(false);
    };

    fetchProject();
  }, [idWithSlug]);


  if (error) {
    return (
      <EditProjectError 
        title="Une erreur est survenue"
        description="Impossible de charger le projet"
      />
    );
  }

  if (isLoading) {
    return <EditProjectLoading />;
  }

  if (!project) {
    return (
      <EditProjectError
        title="Projet non trouvé"
        description="Le projet que vous recherchez n'existe pas ou a été supprimé."
      />
    );
  }

  const projectStatusId = project.statusId || project.status_id;
  if (projectStatusId !== 1) {
    const statusMessage = projectStatusId === 3
      ? "Ce projet est figé pour signature et ne peut pas être modifié."
      : projectStatusId === 4
        ? "Ce projet est finalisé et ne peut plus être modifié."
        : "Ce projet n'est pas dans un état modifiable.";

    return (
      <EditProjectError
        title="Modification impossible"
        description={statusMessage}
      />
    );
  }

  console.log('=== project === EditProject.tsx === key: 888244 ===');
  console.dir(project, { depth: null, colors: true })
  console.log('=================================');

  const handleSubmit = async (updatedProject) => {
    console.log('=== updatedProject === EditProject.tsx === key: 084783 ===');
    console.dir(updatedProject, { depth: null, colors: true })
    console.log('=================================');

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour modifier un projet",
        variant: "destructive"
      });
      return;
    }

    updatedProject.author.profile =project.author.profile_id;
    //updatedProject.author.profile_id =project.author.profile_id;
    updatedProject.url = Config.ENDPOINT_URL.replace(/\/$/, '') + '/project/' + idWithSlug;

    let updatedProjectResult;
    if(project.id){
      updatedProjectResult = await updateProject( project.id,updatedProject);
    }
    else{
      updatedProjectResult = await createProject( updatedProject);
    }
    

    console.log('=== updatedProjectResult === EditProject.tsx === key: 062719 ===');
    console.dir(updatedProjectResult, { depth: null, colors: true })
    console.log('=================================');

    if(updatedProjectResult?.success === false){
      toast({
        title: "Erreur",
        description: updatedProjectResult.error,
        variant: "destructive"
      });
      return updatedProjectResult;
    }


    toast({
      title: "Succès",
      description: "Le projet a été mis à jour avec succès",
    });

    navigate(`/project/${idWithSlug}`)
  };

  const initialFormData = {
    title: decodeHtmlEntities(project.title),
    description: decodeHtmlEntities(project.description),
    dueDate: project.dueDate,
    thumbnail: project.thumbnail,
    category: project.category||"",
    client: decodeHtmlEntities(project.client),
    testimonial: decodeHtmlEntities(project.testimonial) || "",
    links: project.links || [],
    statusId: project.statusId || project.status_id,
    url: project.url || "",
    nftImg: project.nftImg || "",
  };

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      onCancel={() => navigate(`/project/${idWithSlug}`)}
      initialData={initialFormData}
      initialParticipants={project.participants?.map(p => ({
        profile: p.profile_id,
        contribution: p.contribution,
        contributionDescription: decodeHtmlEntities(p.contributionDescription) || ""
      }))}
      initialObservers={project.observers?.map(p => ({
        profile: p.profile_id,
        contribution: p.contribution,
        contributionDescription: decodeHtmlEntities(p.contributionDescription) || ""
      }))}
      initialTeamLeaderContribution={project.author.contribution}
      initialTeamLeaderContributionDescription={decodeHtmlEntities(project.author.contributionDescription) || ""}
    />
  );
};

export default EditProject;
import { useState } from "react";
import { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Feather, Copy, Mail, LogIn } from "lucide-react"; // Ajout de l'icône Copy
import { Link } from "react-router-dom";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectDetailsComponent } from "@/components/project/ProjectDetailsComponent";
import { LinkedinIcon, YoutubeIcon, GithubIcon, Music2Icon, InstagramIcon, FacebookIcon, GlobeIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSession } from "@/hooks/useSession";

import { updateProjectStatus } from "@/api/projects";
import { useParams, useNavigate } from "react-router-dom";
import ReRenderer from "@utils/reRenderer";
import Config from "@config";
import { FaWhatsapp, FaFacebookMessenger } from 'react-icons/fa';

interface ProjectContentProps {
  project: Project;
  isProjectCreator: boolean;
  onEditClick: () => void;
  idWithSlug: string;
}

export const ProjectContent = ({
  project,
  isProjectCreator,
  onEditClick,
  idWithSlug
}: ProjectContentProps) => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Vérifier si l'utilisateur n'est pas connecté et si le projet est prêt à être signé
  const showLoginMessage = !user && project.statusId === 3;

  const onFreezeProjectHandler = async () => {
    // ... code existant pour geler le projet ...
    const updatedProject = {
      ...project,
      url: Config.ENDPOINT_URL.replace(/\/$/, '') + '/project/' + idWithSlug,
      statusId: 3
    };

    const response = await updateProjectStatus(project.id, updatedProject);

    if (response.success === false) {
      return;
    }

    ReRenderer.reload();
  };

  const onUnfreezeProjectHandler = async () => {
    // ... code existant pour dégeler le projet ...
    const updatedProject = {
      ...project,
      statusId: 1
    };

    const response = await updateProjectStatus(project.id, updatedProject);

    if (response.success === false) {
      return;
    }

    ReRenderer.reload();
  };

  const projectName = project.title;
  const projectUrl = Config.ENDPOINT_URL.replace(/\/$/, '') + '/project/' + idWithSlug;
  const inviteMessage = encodeURIComponent(`Je t'invite à venir signer le projet ${projectName}\n\n${projectUrl}`);

  const messengerLink = `https://www.messenger.com/`;
  const whatsappLink = `https://wa.me/?text=${inviteMessage}`;
  const emailLink = `mailto:?subject=Invitation à signer le projet ${encodeURIComponent(projectName)}&body=${inviteMessage}`;

  // Fonction de copie dans le presse-papier avec rétroaction
  const handleCopy = () => {
    navigator.clipboard.writeText(projectUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // rétroaction visible 1.5 sec
      })
      .catch(err => console.error("Erreur lors de la copie dans le presse-papier", err));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux Projets
            </Button>
          </Link>
          {isProjectCreator && (
            <div className="flex justify-between items-center mb-6 gap-2">
              {project.statusId === 1 && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    style={{ backgroundColor: "lightblue" }}
                    onClick={onFreezeProjectHandler}
                  >
                    Figer le projet
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={onEditClick}
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier le projet
                  </Button>
                </>
              )}
              {project.statusId === 3 && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    style={{ backgroundColor: "orange" }}
                    onClick={onUnfreezeProjectHandler}
                  >
                    Défiger le projet
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <Feather className="w-4 h-4" />
                    Inviter à signer
                  </Button>
                </>
              )}
              {project.statusId === 4 && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={onEditClick}
                >
                  <Pencil className="w-4 h-4" />
                  Modifier le projet
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Message pour inviter les utilisateurs non connectés à se connecter */}
        {showLoginMessage && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <LogIn className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Connexion requise</AlertTitle>
            <AlertDescription className="text-blue-700">
              Connectez-vous pour pouvoir signer ce projet. Cliquez sur "Se connecter" dans le menu en haut à droite.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <img
            src={project.thumbnail || project.banner_url}
            alt={project.title}
            className="w-full h-96 object-cover"
          />
          <div className="p-8">
            <ProjectHeader project={project} />
            <ProjectDetailsComponent project={project} />
          </div>
        </div>

        {/* Modal d'invitation */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Inviter à signer</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
              <p className="mb-4">
                <strong>Message:</strong>
              </p>
              <p className="mb-1">
                Je t'invite à venir signer le projet <strong>{projectName}</strong>.
              </p>
              <p className="mb-4 flex items-center gap-2">
                <span>{projectUrl}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                  title="Copier le lien"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && <span className=" text-sm">Copié</span>}
              </p>
              <div className="flex justify-around">
                <a href={messengerLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FaFacebookMessenger className="w-4 h-4" />
                    Messenger
                  </Button>
                </a>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FaWhatsapp className="w-4 h-4" />
                    Whatsapp
                  </Button>
                </a>
                <a href={emailLink}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

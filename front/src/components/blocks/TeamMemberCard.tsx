import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useProjectService } from "@/services";
import ReRenderer from "@utils/reRenderer";
import { useToast } from "@/components/ui/use-toast";
import { useWeb3Auth } from "@/contexts/Web3AuthContext";
import { decodeHtmlEntities } from "@/utils/textUtils";

interface TeamMemberCardProps {
  profile_id: string;
  name: string;
  username: string;
  avatar: string;
  contribution: number | null;
  contributionDescription?: string;
  expertise?: string;
  bio?: string;
  isSigned?: boolean;
  projectStatus?: number;
  projectId?: string;
  stringified?: string;
  hash?: string;
}

export const TeamMemberCard = ({
  profile_id,
  name,
  username,
  avatar,
  contribution,
  contributionDescription,
  expertise,
  bio,
  isSigned,
  projectStatus,
  projectId,
  stringified,
  hash
}: TeamMemberCardProps) => {
  const navigate = useNavigate();
  const { session, currentProfile } = useSession();
  const { isConnected: isWeb3AuthConnected, login: connectWeb3Auth } = useWeb3Auth();
  const [showSignature, setShowSignature] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const { toast } = useToast();
  const projectService = useProjectService();

  const handleClick = () => {
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const handleSignProject = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Afficher la zone de signature (bouton "Sign project" cliqué)
    setShowSignature(true);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate that hash exists before proceeding
    if (!hash || hash.trim() === '') {
      toast({
        title: "Erreur",
        description: "Le projet n'a pas encore été gelé et ne peut pas être signé.",
        variant: "destructive",
      });
      return;
    }

    // Check if Web3Auth is connected, if not try to connect silently first
    if (!isWeb3AuthConnected) {
      try {
        await connectWeb3Auth();
        // After successful connection, continue with signing
      } catch (error) {
        console.error("Web3Auth connection failed:", error);
        toast({
          title: "Connexion requise",
          description: "Vous devez vous connecter à Web3Auth pour signer ce projet.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSigning(true);

    const payload = {
      projectId: projectId,
      profile: {
        id: currentProfile?.id,
      },
      hash: hash,
    };

    console.log("Signature confirmée");
    console.log("Payload being sent:", payload);

    let signedProject;
    try {
      console.log("About to call projectService.signProject...");
      signedProject = await projectService.signProject(payload);
      console.log("ProjectService signProject response:", signedProject);
    } catch (error) {
      console.error("Error calling signProject:", error);
      
      // Provide specific error message for Web3Auth connection issues
      let errorMessage = "Une erreur s'est produite lors de la signature du projet.";
      if (error.message?.includes("Web3Auth not connected")) {
        errorMessage = "Vous devez être connecté à Web3Auth pour signer. Veuillez vous reconnecter.";
      } else if (error.message?.includes("No provider available")) {
        errorMessage = "Connexion Web3Auth manquante. Veuillez rafraîchir la page et vous reconnecter.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de signature",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSigning(false);
      return;
    }

    if (signedProject.success === false) {
      // Extract meaningful error message from backend response
      let errorDescription = "Une erreur s'est produite lors de la signature du projet.";

      if (signedProject.message) {
        errorDescription = signedProject.message;
      } else if (signedProject.error) {
        errorDescription = signedProject.error;
      }

      toast({
        title: "Erreur de certification",
        description: errorDescription,
        variant: "destructive",
      });
      setIsSigning(false);
      return;
    }

    toast({
      title: "Projet signé avec succès",
      description: "Votre signature a été enregistrée.",
      variant: "default",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    ReRenderer.reload();
  };

  const isClient = expertise === "Client";
  const isCollective = expertise === "Collectif";
  const fallbackText = name ? name[0] : "?";

  return (
    <div
      className="w-full cursor-pointer"
      onClick={handleClick}
    >
      <Card className="p-4 w-full hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="flex-shrink-0">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="bg-gray-200 text-gray-600">
              {fallbackText}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            {isCollective ? (
              <>
                <h4 className="font-semibold text-left whitespace-normal break-words">
                  {decodeHtmlEntities(name)}
                </h4>
                {!isClient && (
                  <p className="text-sm text-gray-600 text-left whitespace-normal break-words">
                    @{username}
                  </p>
                )}
              </>
            ) : (
              <>
                <h4 className="font-semibold text-left whitespace-normal break-words">
                  {decodeHtmlEntities(name)}
                </h4>
                {!isClient && (
                  <p className="text-sm text-gray-600 text-left whitespace-normal break-words">
                    @{username}
                  </p>
                )}
                {expertise && !isClient && (
                  <p className="text-sm text-gray-600 text-left whitespace-normal break-words">
                    {decodeHtmlEntities(expertise)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {bio && (
          <div className="text-sm text-gray-600 text-left mb-4">
            <p className="whitespace-normal break-words">{decodeHtmlEntities(bio)}</p>
          </div>
        )}
        {!isClient && contribution !== null && (
          <div className="text-left mt-2 pt-2 border-t  mb-4">
            <span className="text-sm text-gray-600">
              Contribution: {contribution}%
            </span>
          </div>
        )}
        {projectStatus === 3 && isSigned && (
          <div className="text-sm text-gray-600 text-left mb-4">
            <p className="whitespace-normal break-words">Projet signé</p>
          </div>
        )}
        {profile_id === currentProfile?.id &&
          projectStatus === 3 &&
          !isSigned &&
          !showSignature &&
          hash &&
          hash.trim() !== '' && (
            <div className="text-sm text-gray-600 text-left mb-4">
              <Button
                onClick={handleSignProject}
                variant="outline"
                className="w-full"
                style={{ backgroundColor: "lightcyan" }}
              >
                Signer le projet
              </Button>
            </div>
          )}
        {showSignature && (
          <div className="text-sm text-gray-600 text-left mb-4">
            <p className="mb-2">
              Vous allez signer ceci. Veuillez confirmer en cliquant ci-dessous!
            </p>
            {/* Bouton pour afficher/masquer le JSON du contrat */}
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowContract(!showContract);
              }}
              className="mb-2"
            >
              {showContract ? "Masquer le contrat" : "Voir le contrat"}
            </Button>
            {showContract && (
              <div
                style={{
                  maxHeight: "200px",
                  overflow: "auto",
                  background: "lightgray",
                  padding: "10px"
                }}
              >
                <pre>{JSON.stringify(JSON.parse(stringified), null, 2)}</pre>
              </div>
            )}
            <br />
            <p className="mb-2">Confirmer la signature avec Web3Auth</p>
            {
              !isSigning && <Button
              onClick={handleConfirm}
              variant="outline"
              className="w-full"
              style={{ marginTop: "10px" }}
            >
              Confirmer la signature
            </Button>
            }
          </div>
        )}
        {!isClient && contributionDescription && (
          <div className="text-sm text-gray-600 text-left mb-4">
            <p className="whitespace-normal break-words">
              {decodeHtmlEntities(contributionDescription)}
            </p>
          </div>
        )}
        
      </Card>
    </div>
  );
};

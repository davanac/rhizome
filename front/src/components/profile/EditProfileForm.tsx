import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ProfileImageSection } from "./ProfileImageSection";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { SocialLinksSection } from "./SocialLinksSection";
import { Separator } from "@/components/ui/separator";

import { useNavigate } from "react-router-dom";
import { DangerZone } from "./DangerZone";
import { FormActions } from "./FormActions";
import { ProfileFormData } from "./types/ProfileFormData";
import { validateProfileForm } from "./utils/formValidation";
import { useSession } from "@/hooks/useSession";
import ReRenderer from '@utils/reRenderer';
import {updateProfile} from "@/api/profiles";
import { decodeHtmlEntities } from "@/utils/textUtils";

interface EditProfileFormProps {
  onClose: () => void;
  onUpdate: (updatedUser) => void;
}

export const EditProfileForm = ({ onClose, onUpdate }: EditProfileFormProps) => {

  const { currentProfile, clearSession, refreshSession, setInSession, session } = useSession();


  console.log('=== useSession === EditProfileForm.tsx === key: 246068 ===');
  console.dir(useSession, { depth: null, colors: true })
  console.dir(session, { depth: null, colors: true })
  console.log('=================================');

  const user = { ...(currentProfile || {}) };

  const navigate = useNavigate();

  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.first_name || user?.firstName || "",
    lastName: user?.last_name || user?.lastName || "",
    username: user?.username || "",
    bio: decodeHtmlEntities(user?.bio) || "",
    expertise: decodeHtmlEntities(user?.expertise) || "",
    collectif: user?.["collectif-name"] || user?.collectif_name || "",
    avatarUrl: user?.avatar_url || user?.avatarUrl || "",
    bannerUrl: user?.banner_url || user?.bannerUrl || "",
    website: user?.links?.find((link) => link.link_type === "website")?.url || "",
    linkedin: user?.links?.find((link) => link.link_type === "linkedin")?.url || "",
    youtube: user?.links?.find((link) => link.link_type === "youtube")?.url || "",
    github: user?.links?.find((link) => link.link_type === "github")?.url || "",
    spotify: user?.links?.find((link) => link.link_type === "spotify")?.url || "",
    instagram: user?.links?.find((link) => link.link_type === "instagram")?.url || "",
    facebook: user?.links?.find((link) => link.link_type === "facebook")?.url || "",
    accountType: user?.account_type || user.profile_type || "individual",
  });



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm(formData, toast)) return;

    const refreshedSession = await refreshSession();

    console.log('=== session === EditProfileForm.tsx === key: 693079 ===');
    console.dir(session, { depth: null, colors: true })
    console.log('=================================');

    if (!refreshedSession) {
      toast({
        title: "Erreur d'authentification",
        description: "Votre session a expiré. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      //onClose();
      //ReRenderer.render();
      //setRefreshingSession(false);
      return;
    }

    console.log('=== formData === EditProfileForm.tsx === key: 362522 ===');
    console.dir(formData, { depth: null, colors: true })
    console.log('=================================');

    //return;

    setLoading(true);

    try {
     

      const response = await updateProfile(currentProfile.id,formData);

      console.log('=== response === EditProfileForm.tsx === key: 227951 ===');
      console.dir(response, { depth: null, colors: true })
      console.log('=================================');

      

      //return;

      if(response?.success===true)
      {
        if(response.primaryProfile){
          setInSession("primaryProfile",response.primaryProfile);
        }
  
        if(response.profiles){
          setInSession("profiles",response.profiles);
        }
        
        toast({
          title: "Profil mis à jour",
          description: "Vos modifications ont été enregistrées avec succès.",
        });
  
        /** ------------------ cmt 055146 ------------------
        onUpdate(updatedUser);
        onClose();
        *-------------------------------------------------*/
  
        
          navigate(`/profile/${response.username}`, { replace: true });
          window.location.reload();
        ReRenderer.render();
      }
      else
      {
        // Parse the error to see if it's a field-specific validation error
        const errorMessage = response?.message || "Une erreur est survenue lors de la mise à jour du profil.";
        const errorCode = response?.errorCode || "";
        
        // Clear previous field errors
        setFieldErrors({});
        
        // Check if it's a field-specific validation error
        if (errorCode.includes('-invalid-')) {
          // Extract the field name from the error code (e.g., "youtube-invalid-url" -> "youtube")
          const fieldName = errorCode.split('-')[0];
          
          // Set field-specific error
          setFieldErrors({ [fieldName]: errorMessage });
          
          // Show toast with specific message
          toast({
            title: "Erreur de validation",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          // Generic error
          toast({
            title: "Erreur",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }

      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!session) return;
return;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfileImageSection
        bannerUrl={formData.bannerUrl}
        avatarUrl={formData.avatarUrl}
        firstName={formData.firstName}
        lastName={formData.lastName}
        onFieldChange={handleFieldChange}
        required={true}
      />

      <Separator className="my-6" />

      <PersonalInfoSection
        firstName={formData.firstName}
        lastName={formData.lastName}
        expertise={formData.expertise}
        collectif={formData.collectif}
        bio={formData.bio}
        username={formData.username}
        accountType={formData.accountType}
        onFieldChange={handleFieldChange}
        required={true}
      />

      <Separator className="my-6" />

      <SocialLinksSection
        website={formData.website}
        linkedin={formData.linkedin}
        github={formData.github}
        youtube={formData.youtube}
        spotify={formData.spotify}
        instagram={formData.instagram}
        facebook={formData.facebook}
        onFieldChange={handleFieldChange}
        fieldErrors={fieldErrors}
      />

      <FormActions onClose={onClose} loading={loading} />

      <Separator className="my-6" />

      <DangerZone onDeleteAccount={handleDeleteAccount} />
    </form>
  );
};
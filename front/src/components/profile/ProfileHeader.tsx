import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EditProfileDialog } from "./EditProfileDialog";

import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileSocial } from "./ProfileSocial";
import { getProfileById, getProfileByUsername } from "@/api/profiles";
import { useSession } from "@/hooks/useSession";
import { decodeHtmlEntities } from "@/utils/textUtils";

export const ProfileHeader = ({ initialUser, username }) => {
  const { session, currentProfile, primaryProfile, profiles, refreshSession } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  //const [currentProfile, setCurrentProfile] = useState(null);
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  const fetchUserData = async () => {
    await refreshSession();
    if (!user?.username) {
      setLoading(false);
      setError("Nom d'utilisateur non trouvé");
      return;
    }

    try {

      const { profile, error } = await getProfileByUsername(username);

      if (error) {
        console.error('Error fetching profile:', error);
        setError("Impossible de charger le profil");
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!profile) {
        setError("Profil introuvable");
        toast({
          title: "Profil introuvable",
          description: "Ce profil n'existe pas",
          variant: "destructive",
        });
        //navigate('/');
        return;
      }

      const userData = { ...profile }

      console.log('=== userData === ProfileHeader.tsx === key: 812459 ===');
      console.dir(userData, { depth: null, colors: true })
      console.log('=================================');

      console.log('=== currentProfile === ProfileHeader.tsx === key: 484519 ===');
      console.dir(primaryProfile, { depth: null, colors: true })
      console.log('=================================');



      setUser({
        ...userData,
        name: userData.first_name && userData.last_name ?
          `${userData.first_name} ${userData.last_name}` : '',
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatarUrl: userData.avatar_url,
        bannerUrl: userData.banner_url,
        accountType: userData.account_type || 'individual',
        expertise: userData.expertise,
        collectif: userData["collectif-name"],
      });

      setIsOwnProfile( primaryProfile?.user_id === userData.user_id);
      setError(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError("Une erreur est survenue lors du chargement du profil");
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement du profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {



    fetchUserData();
  }, [user?.username, currentProfile?.id, username]);

  useEffect(() => {

    console.log('=== session in useEffect === ProfileHeader.tsx === key: 356991 ===');
    console.dir(session in useEffect, { depth: null, colors: true })
    console.log('=================================');

    /** ------------------ cmt 318508 ------------------
    if(session?.user?.profiles){
      setCurrentProfile(getCurrentProfile());
    }else{
      setCurrentProfile(null);
    }
    *-------------------------------------------------*/
  }, [session]);

  const handleUpdate = async (updatedUser) => {
    setUser(updatedUser);
    await fetchUserData();
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">
          {error || "Profil introuvable"}
        </h1>
        <p className="text-gray-600 mb-4">
          {error === "Profil introuvable"
            ? "Ce profil n'existe pas ou a été supprimé."
            : "Une erreur est survenue lors du chargement du profil."}
        </p>
        <Button onClick={() => navigate('/')}>Retourner à l'accueil</Button>
      </div>
    );
  }

  console.log('=== user === ProfileHeader.tsx === key: 588027 ===');
  console.dir(user, { depth: null, colors: true })
  console.log('=================================');

  return (
    <div className="relative">
      <ProfileBanner bannerUrl={user.bannerUrl} />

      <div className="container max-w-5xl mx-auto px-4">
        <div className="relative -mt-24 mb-6 flex flex-col items-center">
          <ProfileAvatar
            avatarUrl={user.avatarUrl}
            name={user.name.trim().length?user.name : user.collectif_name}
          />

          <ProfileInfo
            firstName={user.firstName}
            lastName={user.lastName}
            name={user.name.trim().length ? user.name : user.collectif_name}
            username={user.username}
            accountType={user.accountType}
            expertise={user.expertise}
            collectif={user.collectif_name}
          />

          <ProfileSocial user={user} />

          {user?.bio && (
            <Card className="mt-6 p-6 w-full max-w-2xl bg-white shadow-sm">
              <p className="text-center text-gray-600 italic">
                {decodeHtmlEntities(user.bio)}
              </p>
            </Card>
          )}

          {currentProfile && isOwnProfile && (
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-10 px-4"
                onClick={() => {
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Modifier le profil
              </Button>
              {(currentProfile.type === 'individual' || currentProfile.profile_type === 'individual') && (
                <div className="h-10">
                  <NewProjectDialog />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          user={user}
          open={isEditing}
          onOpenChange={setIsEditing}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};
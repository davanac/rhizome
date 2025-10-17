import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileProjects } from "@/components/profile/ProfileProjects";
import { useToast } from "@/components/ui/use-toast";
import {getProfileById, getProfileByUsername} from "@/api/profiles";
import {CertificationBlockByProfile} from "@/components/blocks/CertificationBlockByProfile";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {

    
    const fetchUserProfile = async () => {
      if (!username) {
        console.log('No username found for profile');
        //navigate('/');
        return;
      }

      try {


          const {profile,error} = await getProfileByUsername(username);

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger le profil",
            variant: "destructive",
          });
         // navigate('/');
          return;
        }
        
        if (!profile) {
          toast({
            title: "Profil introuvable",
            description: "Ce profil n'existe pas",
            variant: "destructive",
          });
         // navigate('/');
          return;
        }
        console.log('=== profile === UserProfile.tsx === key: 481193 ===');
        console.dir(profile, { depth: null, colors: true })
        console.log('Profile.id:', profile?.id);
        console.log('Profile keys:', Object.keys(profile || {}));
        console.log('=================================');
        setUser(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement du profil",
          variant: "destructive",
        });
        //navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, toast, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Chargement du profil...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  return (
    <div className="container mx-auto py-8">
      {
        <ProfileHeader initialUser={user} username={username || ''}  />
      }
      {
        user?.id && <CertificationBlockByProfile profileId={user.id } user={user} />
      }

      <ProfileProjects username={username || ''} user={user} />
    </div>
  );
}
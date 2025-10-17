import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SignUpStep2 } from "@/components/signup/SignUpStep2";
import { SignUpStep3 } from "@/components/signup/SignUpStep3";
import { createProfile } from "@/api/profiles";
import { getCurrentUser } from "@/api/auth";
import { useSession } from '@/hooks/useSession';

const CreateProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Check if user is authenticated with Web3Auth
  if (!user) {
    navigate('/');
    return null;
  }

  // For secondary profiles, don't redirect
  // Only show this as an initial profile creation if user has no profiles
  const isSecondaryProfile = user.profiles && user.profiles.length > 0;

  const [formData, setFormData] = useState({
    accountType: isSecondaryProfile ? 'collectif' : 'individual', // Default to collective for secondary profiles
    firstName: isSecondaryProfile ? '' : (user.name?.split(' ')[0] || ''), // Don't pre-fill for secondary
    lastName: isSecondaryProfile ? '' : (user.name?.split(' ').slice(1).join(' ') || ''),
    username: '',
    entreprise: '',
    bio: '',
    avatarUrl: isSecondaryProfile ? '' : (user.profileImage || ''), // Don't pre-fill avatar for secondary
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Create profile payload
      const profilePayload = {
        userId: user.userId, // Required by backend for authorization check
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        bio: formData.bio || '',
        avatarUrl: formData.avatarUrl || user.profileImage || '',
        accountType: formData.accountType,
        entreprise: formData.entreprise || '',
        walletAddress: user.walletAddress, // Use wallet address from Web3Auth session
        email: user.email, // Use email from Web3Auth session
      };

      const result = await createProfile(profilePayload);

      if (result.success === false) {
        toast({
          title: "Erreur de création de profil",
          description: result.message || "Impossible de créer votre profil",
          variant: "destructive",
        });
        return;
      }

      // Refresh user data from backend to update session with new profile
      const response = await getCurrentUser();
      
      // Update the session with the new user data including profiles
      if (response && response.success && response.user) {
        const { setSession, getSession } = await import('@/hooks/useSession');
        const currentSession = getSession();
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            user: {
              ...currentSession.user,
              ...response.user,
              profiles: response.user.profiles || [],
              primaryProfile: response.user.primaryProfile || null
            }
          };
          setSession(updatedSession);
        }
      }

      toast({
        title: "Profil créé avec succès",
        description: "Votre profil a été créé. Bienvenue sur Rhizome !",
      });

      // Navigate after profile creation
      if (isSecondaryProfile) {
        // For secondary profiles, go back to current user's primary profile
        if (user.primaryProfile?.username) {
          navigate(`/profile/${user.primaryProfile.username}`);
        } else {
          navigate('/');
        }
      } else {
        // For first profile, navigate to the new profile
        if (formData.username) {
          navigate(`/profile/${formData.username}`);
        } else {
          navigate('/');
        }
      }
      
    } catch (error) {
      console.error('Profile creation error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isSecondaryProfile ? 'Créer un nouveau profil' : 'Créer votre profil'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSecondaryProfile 
                ? 'Créez un profil supplémentaire (marque, entreprise, etc.)'
                : 'Complétez votre profil pour commencer à utiliser Rhizome'
              }
            </p>
            <div className="mt-4">
              <div className="flex justify-center items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              {isSecondaryProfile && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type de profil</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="accountType"
                        value="individual"
                        checked={formData.accountType === 'individual'}
                        onChange={(e) => handleChange('accountType', e.target.value)}
                        className="mr-2"
                      />
                      Personnel
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="accountType"
                        value="collectif"
                        checked={formData.accountType === 'collectif'}
                        onChange={(e) => handleChange('accountType', e.target.value)}
                        className="mr-2"
                      />
                      Marque/Entreprise
                    </label>
                  </div>
                </div>
              )}
              <SignUpStep2
                formData={formData}
                onChange={handleChange}
                onNext={handleNext}
                onBack={() => isSecondaryProfile ? navigate(-1) : navigate('/')}
                loading={loading}
              />
            </div>
          )}

          {currentStep === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <SignUpStep3
                avatarUrl={formData.avatarUrl}
                onChange={handleChange}
                onBack={handleBack}
                loading={loading}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
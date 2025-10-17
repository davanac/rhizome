import { useState } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/use-toast';
import { useAuthService } from '@/services';

interface Web3AuthButtonProps {
  provider?: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

const Web3AuthButton: React.FC<Web3AuthButtonProps> = ({ 
  provider, 
  children, 
  variant = "default",
  className = "" 
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const authService = useAuthService();

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      const result = await authService.loginWithWeb3Auth(provider);
      
      if (result.success === false) {
        return;
      }

      // Navigate to user's profile or profile creation
      if (result.user?.primaryProfile?.username) {
        navigate(`/profile/${result.user.primaryProfile.username}`);
      } else {
        // If no profile yet, go to profile creation page
        navigate('/create-profile');
      }
      
    } catch (error) {
      console.error('Web3Auth login error:', error);
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
    <Button 
      onClick={handleLogin} 
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? "Connexion..." : children}
    </Button>
  );
};

export default Web3AuthButton;
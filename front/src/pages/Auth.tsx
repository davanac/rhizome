import Web3AuthButton from "@/components/Web3AuthButton";
import { useSession } from '@/hooks/useSession'; 
import { Navigate } from "react-router-dom";

const Auth = () => {
  const { user } = useSession();

  // If user is already authenticated, redirect to their profile or home
  if (user) {
    if (user.primaryProfile?.username) {
      return <Navigate to={`/profile/${user.primaryProfile.username}`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenue sur Rhizome</h1>
            <p className="text-gray-600 mt-2">
              Connectez-vous avec Web3Auth pour accéder à votre compte
            </p>
          </div>

          <div className="space-y-4">
            <Web3AuthButton provider="google" variant="outline" className="w-full">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuer avec Google
            </Web3AuthButton>
            
            <Web3AuthButton variant="outline" className="w-full">
              Se connecter avec Web3Auth
            </Web3AuthButton>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              En vous connectant, vous acceptez nos conditions d'utilisation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
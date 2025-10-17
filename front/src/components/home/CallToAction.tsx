import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthService } from '@/services';
import { useToast } from "@/components/ui/use-toast";
import web3AuthService from '@/services/web3auth.service';

export const CallToAction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const authService = useAuthService();

  const handleGetStarted = async () => {
    try {
      // Clear Web3Auth storage before login to show full provider selection
      web3AuthService.clearWeb3AuthStorage();
      
      const result = await authService.loginWithWeb3Auth();
      if (result.success) {
        // Check if user has a profile
        if (result.user?.profiles && result.user.profiles.length > 0) {
          // User has profile(s), navigate to their profile or home
          if (result.user.primaryProfile?.username) {
            navigate(`/profile/${result.user.primaryProfile.username}`);
          } else {
            navigate('/');
          }
        } else {
          // New user without profile, redirect to create profile
          navigate('/create-profile');
        }
        // Don't reload the page, let React Router handle navigation
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Rejoignez la Révolution
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Ensemble, construisons un écosystème où la confiance, la reconnaissance et la collaboration définissent chaque interaction professionnelle.
        </p>
        <Button 
          size="lg" 
          variant="outline" 
          className="bg-white text-primary hover:bg-gray-100"
          onClick={handleGetStarted}
        >
          Commencer maintenant
        </Button>
      </div>
    </section>
  );
};
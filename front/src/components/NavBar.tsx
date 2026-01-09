/**
 * Component: NavBar
 * Description: Navigation bar component displaying site logo, links, and user menu.
 * Handles user authentication state and navigation actions.
 */
import { Link, useNavigate } from "react-router-dom";
import { UserCircle2, LogOut, Users, ChevronDown, UserPlus, Settings, ShieldCheck, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useSession } from '@/hooks/useSession';
import { useAuthService } from '@/services';
import web3AuthService from '@/services/web3auth.service';
import ReRenderer from "@utils/reRenderer";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

const NavBar = () => {
  const { session, user, clearSession, setInSession, currentProfile, profiles, sessionKeys } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const authService = useAuthService();

  // État pour stocker éventuellement la source de l’image logo
  const [logoSrc, setLogoSrc] = useState(null);
  // État pour le titre à afficher si l’image n’existe pas
  const [title, setTitle] = useState("Rhizome Protocol");

  useEffect(() => {
    // Fonction pour essayer différentes extensions de logo
    const tryFetchLogo = async () => {
      const possibleExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
      for (const ext of possibleExtensions) {
        const url = `/logo.${ext}`;
        try {
          // Utilisation de la méthode HEAD
          const res = await fetch(url, { method: 'HEAD' });
          // Vérifie que :
          //  1) res.ok est vrai (status 200-299)
          //  2) le Content-Type commence par "image/"
          const contentType = res.headers.get('Content-Type') || '';
          if (res.ok && contentType.toLowerCase().startsWith('image/')) {
            // Si c’est effectivement une image, on l’utilise
            setLogoSrc(url);
            return;
          }
        } catch (error) {
          // En cas d’erreur de fetch, on ne fait rien et on continue la boucle
        }
      }
    };

    // Fonction pour tenter de récupérer le "title" dans texts.base.json
    const tryFetchTitleFromJson = async () => {
      try {
        const res = await fetch("/texts.base.json");
        if (!res.ok) return;
        const data = await res.json();
        if (data.rhizome_name) {
          setTitle(data.rhizome_name);
        }
      } catch (error) {
        // en cas d’erreur, on ne fait rien et on garde la valeur par défaut
      }
    };

    // Fonction principale qui orchestre la recherche d’un logo ou du titre
    const fetchResources = async () => {
      await tryFetchLogo();

      // Si pas de logo, on tente de charger le json
      if (!logoSrc) {
        await tryFetchTitleFromJson();
      }
    };

    fetchResources();
  }, [logoSrc]);

  const handleLogout = async () => {
    // Use the logout function from auth service which includes Web3Auth cleanup
    await authService.logout();
    ReRenderer.reload();
  };

  const handleLogin = async () => {
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
      } else if (result.errorCode !== 'web3auth-login-cancelled') {
        // Only show error if not cancelled by user
        toast({
          title: "Erreur de connexion",
          description: result.message || "Une erreur est survenue lors de la connexion",
          variant: "destructive",
        });
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

  const getProfilePath = (index = 0) => {
    if (!user) return "/";
    const username = profiles[index]?.username || null;
    return username ? `/profile/${username}` : "/";
  };

  return (
    <nav className="bg-gray-50">
      <div className="container mx-auto px-4 py-3">
        {/* Colonne par défaut sur mobile, ligne+justify-between à partir de sm */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          {/* Logo ou texte */}
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="logo"
                  className="h-20 w-auto flex-shrink-0 object-contain"
                />
              ) : (
                title
              )}
            </Link>
          </div>

          {/* Menu droit : mt-4 sur mobile pour passer sous le logo */}
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Button
              variant="outline"
              className="hover:bg-gray-100"
              onClick={() =>
                window.open("https://rhizome-protocol.net/", "_blank", "noopener,noreferrer")
              }
            >
              à propos de Rhizome Protocol
            </Button>
            {user ? (
              <>
                {/* Admin dropdown menu */}
                {user.isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Admin</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Gestion des utilisateurs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/projects" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Gestion des projets
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/minting" className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Gestion du minting
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {/* User dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <UserCircle2 className="h-5 w-5" />
                      <span className="hidden sm:inline">Mon compte</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <span className="hidden sm:inline">Mes profils</span>
                    {profiles.map((profile, index) => (
                      <DropdownMenuItem asChild key={index}>
                        <Link
                          to={getProfilePath(index)}
                          className="flex items-center gap-2"
                          onClick={() => setInSession(sessionKeys.CURRENT_PROFILE_INDEX, index)}
                        >
                          <UserCircle2 className="h-4 w-4" />
                          {"@" + profile.username}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {
                      /** ------------------ cmt 420785 ------------------
                      <DropdownMenuItem asChild>
                      <Link to="/users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Communauté
                      </Link>
                    </DropdownMenuItem>
                      *-------------------------------------------------*/
                    }
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/create-profile" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Nouveau profil
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="hover:bg-gray-100"
                onClick={handleLogin}
              >
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

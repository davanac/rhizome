import { sha256 } from "js-sha256";
import web3AuthService from "@/services/web3auth.service";
import ReRenderer from "@utils/reRenderer";
import type { LoginResult, SessionResult, AuthDependencies } from "./types/auth.types";

/**
 * AuthService - Encapsulates authentication business logic with dependency injection
 */
export class AuthService {
  constructor(private dependencies: AuthDependencies) {}

  /**
   * Calculate SHA256 hash of a string
   * @param str - String to hash
   * @returns Hexadecimal hash
   */
  async hashSHA256(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Login with Web3Auth - handles complete authentication flow
   * @param provider - Optional provider (google, facebook, email_passwordless, etc.)
   * @returns Login result with user data or error
   */
  async loginWithWeb3Auth(provider: string | null = null): Promise<LoginResult> {
    const { authApi, toast } = this.dependencies;

    try {
      // Step 1: Login with Web3Auth
      const web3AuthUser = await web3AuthService.login(provider);
      
      if (!web3AuthUser) {
        toast({
          title: "Connexion annulée",
          description: "La connexion Web3Auth a été annulée",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Web3Auth login cancelled"
        };
      }

      // Step 2: Get nonce from backend for signature verification
      const nonceResult = await authApi.getAuthNonce(web3AuthUser.address);
      
      if (!nonceResult.success) {
        toast({
          title: "Erreur d'authentification",
          description: "Impossible d'obtenir le nonce d'authentification",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Failed to get authentication nonce"
        };
      }

      // Step 3: Create message using the nonce and timestamp from backend
      const message = `Sign this message to authenticate with Rhizome.\n\nNonce: ${nonceResult.nonce}\nWeb3Auth ID: ${web3AuthUser.web3authId}\nTimestamp: ${nonceResult.timestamp}`;

      // Step 4: Sign the message with Web3Auth
      let signature;
      try {
        signature = await web3AuthService.signMessage(message);
      } catch (signError) {
        console.error('Signature error:', signError);
        
        // If signature failed/cancelled, logout from Web3Auth to reset state
        try {
          await web3AuthService.logout();
        } catch (logoutError) {
          console.error('Error logging out after signature failure:', logoutError);
        }
        
        toast({
          title: "Signature échouée",
          description: "La signature du message d'authentification a échoué",
          variant: "destructive",
        });
        
        return {
          success: false,
          error: "Failed to sign authentication message"
        };
      }
      
      if (!signature || signature.success === false) {
        // If signature failed/cancelled, logout from Web3Auth to reset state
        try {
          await web3AuthService.logout();
        } catch (logoutError) {
          console.error('Error logging out after signature failure:', logoutError);
        }
        
        toast({
          title: "Signature échouée",
          description: "La signature du message d'authentification a échoué",
          variant: "destructive",
        });
        
        return {
          success: false,
          error: "Failed to sign authentication message"
        };
      }

      // Step 5: Send signature to backend for verification and authentication
      const authPayload = {
        web3authId: web3AuthUser.web3authId,
        email: web3AuthUser.email,
        name: web3AuthUser.name,
        profileImage: web3AuthUser.profileImage,
        walletAddress: web3AuthUser.address,
        verifier: web3AuthUser.verifier,
        typeOfLogin: web3AuthUser.typeOfLogin,
        signature: signature,
        originalVerifierId: web3AuthUser.originalVerifierId,
      };

      const result = await authApi.loginRequest(null, null, authPayload);

      if (result.success === false) {
        // If backend authentication failed, logout from Web3Auth to reset state
        try {
          await web3AuthService.logout();
        } catch (logoutError) {
          console.error('Error logging out after backend auth failure:', logoutError);
        }
        
        toast({
          title: "Erreur d'authentification",
          description: "L'authentification backend a échoué",
          variant: "destructive",
        });
        
        return {
          success: false,
          error: "Backend authentication error"
        };
      }

      // Step 6: Process user data and create session
      const user = result.data.data.user;
      user.currentProfileIndex = 0;
      user.walletAddress = web3AuthUser.address;
      
      const session = {
        accessToken: result.data.data.accessToken,
        refreshToken: result.data.data.refreshToken,
        user,
        web3auth: web3AuthUser,
      };

      console.log('Setting session after Web3Auth login:', {
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken,
        userId: session.user?.userId,
        userEmail: session.user?.email,
        profiles: session.user?.profiles?.length || 0
      });

      // Use session hooks for state management
      const { setSession } = await import("@/hooks/useSession");
      setSession(session);
      ReRenderer.render();
      
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté à Rhizome",
      });
      
      return { 
        success: true,
        user: result.data.data.user
      };

    } catch (error) {
      console.error('Login error:', error);
      
      // Cleanup Web3Auth state on any error
      try {
        await web3AuthService.logout();
      } catch (logoutError) {
        console.error('Error logging out after login error:', logoutError);
      }
      
      toast({
        title: "Erreur d'authentification",
        description: "Une erreur inattendue s'est produite lors de la connexion",
        variant: "destructive",
      });
      
      return {
        success: false,
        error: "Authentication failed"
      };
    }
  }

  /**
   * Logout user - cleans up session and Web3Auth state
   * @returns Logout result
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    const { router, toast } = this.dependencies;

    try {
      // Clear session first
      const { clearSession } = await import("@/hooks/useSession");
      clearSession();
      
      // Logout from Web3Auth
      await web3AuthService.logout();
      
      // Navigate to home
      router.navigate('/');
      
      // Trigger re-render
      ReRenderer.render();
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté de Rhizome",
      });
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if Web3Auth logout fails, clear session
      const { clearSession } = await import("@/hooks/useSession");
      clearSession();
      ReRenderer.render();
      
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur s'est produite lors de la déconnexion",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Register new user with legacy credentials
   * @param email - User email
   * @param password - User password  
   * @param wallet - Wallet data
   * @returns Registration result
   */
  async registerUser(email: string, password: string, wallet: any): Promise<any> {
    const { authApi, toast } = this.dependencies;

    try {
      const hashedEmail = await this.hashSHA256(email);
      const hashedPassword = await this.hashSHA256(password);
      
      const result = await authApi.registerRequest(hashedEmail, hashedPassword, wallet);
      
      if (result.success) {
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès",
        });
      } else {
        toast({
          title: "Erreur d'inscription",
          description: "L'inscription a échoué",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: "Erreur d'inscription",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
      
      return {
        success: false,
        message: "Registration failed",
        error: error.message
      };
    }
  }

  /**
   * Refresh authentication session
   * @returns Session refresh result
   */
  async refreshSession(): Promise<SessionResult> {
    const { toast } = this.dependencies;

    try {
      const { refreshSession } = await import("@/hooks/useSession");
      const refreshedSession = await refreshSession();

      if (!refreshedSession) {
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        
        return {
          success: false,
          error: "Session expired"
        };
      }

      return {
        success: true,
        session: refreshedSession
      };
    } catch (error) {
      console.error('Session refresh error:', error);
      
      toast({
        title: "Erreur de session",
        description: "Impossible de rafraîchir la session",
        variant: "destructive",
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}
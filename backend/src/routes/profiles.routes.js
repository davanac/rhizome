//path: /src/routes/profiles.routes.js

import * as ProfilesController from "#controllers/profiles.controller.js";
import { authenticateUser, requireProfileOwnership, extractUserId } from "#middleware/auth.middleware.js";
import { validateProfileData, validateProfileLinks } from "#middleware/validation.middleware.js";

export default async (app) => {
  //GET
  app.get(
    "/",
    {
      preHandler: authenticateUser,
      config: {
        protected: true,
      },
    },
    ProfilesController.getUserProfiles
  ); // Récupérer tous les profils de l'utilisateur connecté
  
  app.get(
    "/all",
    {
      preHandler: authenticateUser,
      config: {
        protected: true,
      },
    },
    ProfilesController.getAllProfiles
  ); // Récupérer tous les profils (pour sélection dans les projets)
  app.get("/username/:username", {
    preHandler: extractUserId,
    config: {
      protected: false,
    },
  }, ProfilesController.getProfileByUsername); // Récupérer un profile par son username
  // Route protégée : on ajoute config: { protected: true }
  app.get("/:profileId", {
    preHandler: extractUserId,
    config: {
      protected: false,
    },
  }, ProfilesController.getProfileById); // Récupérer un profil spécifique
  app.get(
    "/check-username-available/:username",
    ProfilesController.checkUsername
  );
  //POST
  app.post("/:profileId/switch", {
    preHandler: [authenticateUser, requireProfileOwnership],
    config: {
      protected: true,
    },
  }, ProfilesController.switchProfile); // Changer le profil actif
  app.post(
    "/",
    {
      preHandler: [authenticateUser, validateProfileData, validateProfileLinks],
      config: {
        protected: true,
      },
    },
    ProfilesController.createProfile
  ); // Créer un nouveau profil

  //PATCH
  /**
   * Route protégée : updateProfile
   */
  app.patch(
    "/:profileId",
    {
      preHandler: [authenticateUser, requireProfileOwnership, validateProfileData, validateProfileLinks],
      config: {
        protected: true,
      },
    },
    ProfilesController.updateProfile
  );
};

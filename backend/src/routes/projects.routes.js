// path: /src/routes/projects.routes.js
import * as ProjectsController from "#controllers/projects.controller.js";

import {
  authenticateUser,
  extractUserId,
  requireProjectOwnership,
  requireProjectParticipation,
} from "#middleware/auth.middleware.js";
import { validateProjectData } from "#middleware/validation.middleware.js";
// import * as ParticipantsController from '#controllers/participants.controller.js'; // éventuellement

export default async (app) => {
  // ----------------------------
  // Routes GET pour les projets
  // ----------------------------
  app.get(
    "/",
    {
      preHandler: extractUserId,
      config: {
        protected: false,
      },
    },
    ProjectsController.getAllProjects
  ); // Récupérer tous les projets
  app.get(
    "/:projectId",
    {
      preHandler: extractUserId,
      config: {
        protected: false,
      },
    },
    ProjectsController.getProject
  ); // Récupérer un projet spécifique
  app.get(
    "/profile/:profileId",
    {
      preHandler: extractUserId,
      config: {
        protected: false,
      },
    },
    ProjectsController.getProjectsByProfileId
  );

  app.get(
    "/stringified/:projectId",
    {
      preHandler: authenticateUser,
      config: {
        protected: true,
      },
    },
    ProjectsController.getProjectSignatureData
  );

  // ----------------------------
  // Routes POST pour les projets
  // ----------------------------
  app.post(
    "/",
    {
      preHandler: [authenticateUser, validateProjectData],
      config: {
        protected: true,
      },
    },
    ProjectsController.createProject
  ); // Créer un projet

  // ----------------------------
  // Routes PATCH pour les projets
  // ----------------------------
  app.patch(
    "/update/:projectId",
    {
      preHandler: [authenticateUser, requireProjectOwnership, validateProjectData],
      config: {
        protected: true,
      },
    },
    ProjectsController.updateProject
  );

  app.patch(
    "/status/:projectId",
    {
      preHandler: [authenticateUser, requireProjectOwnership],
      config: {
        protected: true,
      },
    },
    ProjectsController.updateProjectStatus
  );

  app.patch(
    "/sign/:projectId",
    {
      preHandler: [authenticateUser, requireProjectParticipation],
      config: {
        protected: true,
      },
    },
    ProjectsController.signProject
  );
  // ----------------------------
  // Routes DELETE pour les projets
  // ----------------------------
  app.delete(
    "/:projectId",
    {
      preHandler: [authenticateUser, requireProjectOwnership],
      config: {
        protected: true,
      },
    },
    ProjectsController.deleteProject
  );
};

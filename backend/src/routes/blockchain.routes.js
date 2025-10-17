// path: /src/routes/blockchain.routes.js
import * as BlockchainController from "#controllers/blockchain.controller.js";
import * as ProjectsController from "#controllers/projects.controller.js";

import { authenticateUser, extractUserId, requireAdmin } from "#middleware/auth.middleware.js";

export default async (app) => {
  // ----------------------------
  // Routes GET pour la blockchain
  // ----------------------------
  
  app.get(
    "/nfts/project/:id",
    {
      preHandler: extractUserId,
      config: {
        protected: false,
      },
    },
    BlockchainController.getNFTsForProject
  ); // Récupérer un projet spécifique
  
  app.get(
    "/nfts/profile/:id",
    {
      preHandler: extractUserId,
      config: {
        protected: false,
      },
    },
    BlockchainController.getNFTsForProfile
  ); // Récupérer un projet spécifique



  
  


  

  
};

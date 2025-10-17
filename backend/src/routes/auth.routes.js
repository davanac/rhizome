//path: /src/routes/auth.routes.js

import * as AuthController from "#controllers/auth.controller.js";
import { authenticateUser } from "#middleware/auth.middleware.js";

export default async (app) => {
  //POST - Unified Web3Auth endpoints only
  app.post("/login", AuthController.loginWithWeb3Auth);
  app.post("/logout", AuthController.logout);
  app.post("/refresh-token", AuthController.refreshToken);
  app.post("/auth-nonce", AuthController.getAuthNonce);
  
  //GET
  app.get("/me", { preHandler: authenticateUser }, AuthController.getCurrentUser);
};

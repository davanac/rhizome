// path: /src/routes/admin.routes.js

import * as AdminController from "#controllers/admin.controller.js";
import { authenticateUser, requireAdmin } from "#middleware/auth.middleware.js";

/**
 * Plugin Fastify pour les routes admin
 * @param {object} fastify - Instance Fastify
 */
export default async function adminRoutes(fastify) {
  // Middleware pour toutes les routes admin
  fastify.addHook('preHandler', authenticateUser);
  fastify.addHook('preHandler', requireAdmin);

  // Routes pour la gestion des utilisateurs
  fastify.get('/users', AdminController.getAllUsers);
  fastify.get('/users/:userId', AdminController.getUserById);
  fastify.patch('/users/:userId/toggle-enabled', AdminController.toggleUserEnabled);

  // Routes pour la gestion des projets
  fastify.get('/projects', AdminController.getAllProjects);
  fastify.get('/projects/:projectId', AdminController.getProjectById);
  fastify.patch('/projects/:projectId/toggle-visibility', AdminController.toggleProjectVisibility);
}
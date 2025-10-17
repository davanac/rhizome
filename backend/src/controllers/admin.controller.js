// path: /src/controllers/admin.controller.js

import * as AdminService from "#services/admin.service.js";
import Config from "#config";

/**
 * Lister tous les utilisateurs (admin uniquement)
 */
export const getAllUsers = async (req, reply) => {
  try {
    const result = await AdminService.getAllUsers();
    
    if (result.success === false) {
      return reply.status(500).send({
        success: false,
        message: result.message,
        errorKey: result.errorKey,
        fromError: result.fromError
      });
    }

    reply.send({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    console.log('=== error === admin.controller.js === getAllUsers === key: 200001 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Error fetching users",
      errorKey: 200001,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

/**
 * Récupérer un utilisateur par ID (admin uniquement)
 */
export const getUserById = async (req, reply) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return reply.status(400).send({
        success: false,
        message: "User ID is required",
        errorKey: 200002,
        errorCode: "missing-user-id"
      });
    }

    const result = await AdminService.getUserById(userId);
    
    if (result.success === false) {
      const statusCode = result.errorCode === "user-not-found" ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        message: result.message,
        errorKey: result.errorKey,
        errorCode: result.errorCode,
        fromError: result.fromError
      });
    }

    reply.send({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.log('=== error === admin.controller.js === getUserById === key: 200003 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Error fetching user",
      errorKey: 200003,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

/**
 * Toggle l'état isEnabled d'un utilisateur (admin uniquement)
 */
export const toggleUserEnabled = async (req, reply) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return reply.status(400).send({
        success: false,
        message: "User ID is required",
        errorKey: 200004,
        errorCode: "missing-user-id"
      });
    }

    const result = await AdminService.toggleUserEnabled(userId);
    
    if (result.success === false) {
      const statusCode = result.errorCode === "user-not-found" ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        message: result.message,
        errorKey: result.errorKey,
        errorCode: result.errorCode,
        fromError: result.fromError
      });
    }

    reply.send({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.log('=== error === admin.controller.js === toggleUserEnabled === key: 200005 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Error updating user status",
      errorKey: 200005,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

/**
 * Lister tous les projets (admin uniquement)
 */
export const getAllProjects = async (req, reply) => {
  try {
    const result = await AdminService.getAllProjects();
    
    if (result.success === false) {
      return reply.status(500).send({
        success: false,
        message: result.message,
        errorKey: result.errorKey,
        fromError: result.fromError
      });
    }

    reply.send({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    console.log('=== error === admin.controller.js === getAllProjects === key: 200006 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Error fetching projects",
      errorKey: 200006,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

/**
 * Récupérer un projet par ID (admin uniquement)
 */
export const getProjectById = async (req, reply) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return reply.status(400).send({
        success: false,
        message: "Project ID is required",
        errorKey: 200007,
        errorCode: "missing-project-id"
      });
    }

    const result = await AdminService.getProjectById(projectId);
    
    if (result.success === false) {
      const statusCode = result.errorCode === "project-not-found" ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        message: result.message,
        errorKey: result.errorKey,
        errorCode: result.errorCode,
        fromError: result.fromError
      });
    }

    reply.send({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.log('=== error === admin.controller.js === getProjectById === key: 200008 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Error fetching project",
      errorKey: 200008,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

/**
 * Toggle la visibilité d'un projet (admin uniquement)
 */
export const toggleProjectVisibility = async (req, reply) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return reply.status(400).send({
        success: false,
        message: "Project ID is required",
        errorKey: 200009,
        errorCode: "missing-project-id"
      });
    }

    const result = await AdminService.toggleProjectVisibility(projectId);
    
    if (result.success === false) {
      const statusCode = result.errorCode === "project-not-found" ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        message: result.message,
        errorKey: result.errorKey,
        errorCode: result.errorCode,
        fromError: result.fromError
      });
    }

    reply.send({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.log('=== error === admin.controller.js === toggleProjectVisibility === key: 200010 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    reply.status(500).send({
      success: false,
      message: "Error updating project visibility",
      errorKey: 200010,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};
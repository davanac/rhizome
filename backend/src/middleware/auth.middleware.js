import * as JwtUtil from '#utils/auth/jwt.js';
import Config from '#config';
import pool from '#database/database.js';
import * as ProfilesService from '#services/profiles.service.js';

/**
 * Middleware pour authentifier l'utilisateur via JWT
 */
export async function authenticateUser(req, reply) {
  try {
    // 1️⃣ Vérifier si l’en-tête `Authorization` est présent
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Missing or invalid token',
        errorKey: 173158,
        errorCode:"missing-or-invalid-token"
      });
    }

    // 2️⃣ Extraire le token JWT
    const token = authHeader.split(' ')[1];

    // 3️⃣ Vérifier et décoder le token
    const decoded = JwtUtil.verifyToken(token);

    if (!decoded || !decoded.userId) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Invalid token',
        errorKey: 721296,
        errorCode:decoded?.errorCode || "jwt-invalid",
        fromError: !Config.IN_PROD ? decoded : null,
      });
    }

    // 4️⃣ Vérifier que l'utilisateur est activé
    const userQuery = 'SELECT is_enabled FROM public.users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (!userResult.rows.length || !userResult.rows[0].is_enabled) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - User account disabled',
        errorKey: 721297,
        errorCode: "user-disabled"
      });
    }

    // 5️⃣ Ajouter `userId` et `isAdmin` à `req.user` pour les handlers suivants
    req.user = { 
      userId: decoded.userId,
      isAdmin: decoded.isAdmin || false
    };

    // 5️⃣ Passer au prochain middleware ou handler
  } catch (error) {
    console.log('=== error === auth.middleware.js === key: 803548 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');

    return reply.status(401).send({
      success: false,
      message: 'Unauthorized - Token verification failed',
      errorKey: 899489,
      errorCode:"jwt-expired"
    });
  }
}

export async function extractUserId(req, reply) {
  try {
    // 1️⃣ Vérifier si l’en-tête `Authorization` est présent
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return;
    }

    // 2️⃣ Extraire le token JWT
    const token = authHeader.split(' ')[1];

    // 3️⃣ Vérifier et décoder le token
    const decoded = JwtUtil.verifyToken(token);

    if (!decoded || !decoded.userId) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Invalid token',
        errorKey: 408635,
        errorCode:decoded?.errorCode || "jwt-invalid",
        fromError: !Config.IN_PROD ? decoded : null,
      });
    }

    // 4️⃣ Vérifier que l'utilisateur est activé
    const userQuery = 'SELECT is_enabled FROM public.users WHERE id = $1';
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (!userResult.rows.length || !userResult.rows[0].is_enabled) {
      req.user = null;
      return;
    }

    // 5️⃣ Ajouter `userId` et `isAdmin` à `req.user` pour les handlers suivants
    req.user = { 
      userId: decoded.userId,
      isAdmin: decoded.isAdmin || false
    };

    // 5️⃣ Passer au prochain middleware ou handler
  } catch (error) {
    console.log('=== error === auth.middleware.js === key: 750599 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    req.user = null;
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * Note: Ce middleware doit être utilisé après authenticateUser
 */
export async function requireAdmin(req, reply) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.userId) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401001,
        errorCode: "authentication-required"
      });
    }

    // Vérifier que l'utilisateur est admin
    if (!req.user.isAdmin) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden - Admin access required',
        errorKey: 403001,
        errorCode: "admin-access-required"
      });
    }

    // L'utilisateur est admin, passer au prochain middleware/handler
  } catch (error) {
    console.log('=== error === auth.middleware.js === requireAdmin === key: 403002 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');

    return reply.status(500).send({
      success: false,
      message: 'Internal server error during admin verification',
      errorKey: 500001,
      errorCode: "admin-verification-error"
    });
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire du profil
 * Note: Ce middleware doit être utilisé après authenticateUser
 */
export async function requireProfileOwnership(req, reply) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.userId) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401003,
        errorCode: "authentication-required"
      });
    }

    const profileId = req.params.profileId;
    if (!profileId) {
      return reply.status(400).send({
        success: false,
        message: 'Bad Request - Profile ID required',
        errorKey: 400001,
        errorCode: "profile-id-required"
      });
    }

    // Récupérer le profil et vérifier la propriété
    const profile = await ProfilesService.getProfileById(profileId);
    if (!profile || profile.success === false) {
      return reply.status(404).send({
        success: false,
        message: 'Profile not found',
        errorKey: 404001,
        errorCode: "profile-not-found"
      });
    }

    // Vérifier la propriété du profil
    if (profile.user_id !== req.user.userId) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden - You do not have access to this profile',
        errorKey: 403003,
        errorCode: "profile-access-denied"
      });
    }

    // Ajouter le profil à la requête pour éviter une nouvelle requête DB
    req.profile = profile;

  } catch (error) {
    console.log('=== error === auth.middleware.js === requireProfileOwnership === key: 403004 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');

    return reply.status(500).send({
      success: false,
      message: 'Internal server error during profile ownership verification',
      errorKey: 500002,
      errorCode: "profile-ownership-verification-error"
    });
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire du projet via son profil
 * Note: Ce middleware doit être utilisé après authenticateUser
 */
export async function requireProjectOwnership(req, reply) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.userId) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401004,
        errorCode: "authentication-required"
      });
    }

    const projectId = req.params.projectId;
    if (!projectId) {
      return reply.status(400).send({
        success: false,
        message: 'Bad Request - Project ID required',
        errorKey: 400002,
        errorCode: "project-id-required"
      });
    }

    // Récupérer le projet et vérifier la propriété via le team leader
    const projectQuery = `
      SELECT p.*, pr.user_id as owner_user_id
      FROM public.projects p
      LEFT JOIN public.project_participants pp ON p.id = pp.project_id AND pp.role_id = 1
      LEFT JOIN public.profiles pr ON pp.profile_id = pr.id
      WHERE p.id = $1
      LIMIT 1
    `;
    const projectResult = await pool.query(projectQuery, [projectId]);
    
    if (!projectResult.rows.length) {
      return reply.status(404).send({
        success: false,
        message: 'Project not found',
        errorKey: 404002,
        errorCode: "project-not-found"
      });
    }

    const project = projectResult.rows[0];
    
    // Vérifier la propriété du projet (team leader = owner)
    if (!project.owner_user_id) {
      return reply.status(500).send({
        success: false,
        message: 'Project has no owner assigned',
        errorKey: 500001,
        errorCode: "project-no-owner"
      });
    }
    
    if (project.owner_user_id !== req.user.userId) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden - You do not have access to this project',
        errorKey: 403005,
        errorCode: "project-access-denied"
      });
    }

    // Ajouter le projet à la requête pour éviter une nouvelle requête DB
    req.project = project;

  } catch (error) {
    console.log('=== error === auth.middleware.js === requireProjectOwnership === key: 403006 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');

    return reply.status(500).send({
      success: false,
      message: 'Internal server error during project ownership verification',
      errorKey: 500003,
      errorCode: "project-ownership-verification-error"
    });
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est participant du projet (owner ou member)
 * Note: Ce middleware doit être utilisé après authenticateUser
 */
export async function requireProjectParticipation(req, reply) {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.userId) {
      return reply.status(401).send({
        success: false,
        message: 'Unauthorized - Authentication required',
        errorKey: 401005,
        errorCode: "authentication-required"
      });
    }

    const projectId = req.params.projectId;
    if (!projectId) {
      return reply.status(400).send({
        success: false,
        message: 'Bad Request - Project ID required',
        errorKey: 400003,
        errorCode: "project-id-required"
      });
    }

    // Vérifier que l'utilisateur est participant du projet (team leader, contributor, ou observer)
    const participationQuery = `
      SELECT pp.*, pr.user_id, ppr.role_name
      FROM public.project_participants pp
      JOIN public.profiles pr ON pp.profile_id = pr.id
      JOIN public.project_participant_role ppr ON pp.role_id = ppr.id
      WHERE pp.project_id = $1 AND pr.user_id = $2
      LIMIT 1
    `;
    const participationResult = await pool.query(participationQuery, [projectId, req.user.userId]);
    
    if (!participationResult.rows.length) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden - You are not a participant of this project',
        errorKey: 403006,
        errorCode: "project-participation-required"
      });
    }

    // Ajouter les infos de participation pour les handlers suivants
    req.participation = participationResult.rows[0];
    
  } catch (error) {
    console.log('=== error === auth.middleware.js === requireProjectParticipation === key: 403007 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    
    return reply.status(500).send({
      success: false,
      message: 'Internal server error during authorization check',
      errorKey: 500002,
      errorCode: "authorization-check-failed"
    });
  }
}

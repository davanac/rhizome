// path: /src/services/admin.service.js

import pool from "#database/database.js";
import Config from "#config";

/**
 * Récupère tous les utilisateurs (admin uniquement)
 * @returns {Array} Liste des utilisateurs
 */
export async function getAllUsers() {
  const query = `
    SELECT 
      u.id,
      u.email,
      u.is_active,
      u.created_at,
      u.updated_at,
      u.is_enabled,
      u.is_admin,
      w.verifier_id,
      w.verifier,
      w.type_of_login
    FROM public.users u
    LEFT JOIN public.web3auth_users w ON w.user_id = u.id
    ORDER BY u.created_at DESC
  `;

  try {
    const result = await pool.query(query);
    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    console.log('=== error === admin.service.js === getAllUsers === key: 100001 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching users",
      errorKey: 100001,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Récupère un utilisateur par ID (admin uniquement)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Utilisateur avec ses profils
 */
export async function getUserById(userId) {
  const query = `
    SELECT 
      u.id,
      u.email,
      u.is_active,
      u.created_at,
      u.updated_at,
      u.is_enabled,
      u.is_admin,
      w.verifier_id,
      w.verifier,
      w.type_of_login,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'type', pt.type_name,
            'username', p.username,
            'bio', p.bio,
            'avatar_url', p.avatar_url,
            'created_at', p.created_at
          )
        ) FILTER (WHERE p.id IS NOT NULL), '[]'
      ) AS profiles
    FROM public.users u
    LEFT JOIN public.web3auth_users w ON w.user_id = u.id
    LEFT JOIN public.profiles p ON p.user_id = u.id
    LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
    WHERE u.id = $1
    GROUP BY u.id, u.email, u.is_active, u.created_at, u.updated_at, u.is_enabled, u.is_admin, w.verifier_id, w.verifier, w.type_of_login
  `;

  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
        errorKey: 100002,
        errorCode: "user-not-found"
      };
    }
    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === admin.service.js === getUserById === key: 100003 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching user",
      errorKey: 100003,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Toggle l'état isEnabled d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Résultat de l'opération
 */
export async function toggleUserEnabled(userId) {
  const query = `
    UPDATE public.users 
    SET is_enabled = NOT is_enabled
    WHERE id = $1
    RETURNING id, email, is_enabled
  `;

  try {
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
        errorKey: 100004,
        errorCode: "user-not-found"
      };
    }
    return {
      success: true,
      data: result.rows[0],
      message: `User ${result.rows[0].is_enabled ? 'enabled' : 'disabled'} successfully`
    };
  } catch (error) {
    console.log('=== error === admin.service.js === toggleUserEnabled === key: 100005 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error updating user status",
      errorKey: 100005,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Récupère tous les projets (admin uniquement)
 * @returns {Array} Liste des projets
 */
export async function getAllProjects() {
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.due_date,
      p.category,
      p.client,
      p.status_id,
      p.created_at,
      p.is_visible,
      pr.username as creator_username,
      pr.id as creator_profile_id
    FROM public.projects p
    LEFT JOIN public.project_participants pp ON pp.project_id = p.id AND pp.role_id = 1
    LEFT JOIN public.profiles pr ON pr.id = pp.profile_id
    ORDER BY p.created_at DESC
  `;

  try {
    const result = await pool.query(query);
    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    console.log('=== error === admin.service.js === getAllProjects === key: 100006 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching projects",
      errorKey: 100006,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Récupère un projet par ID (admin uniquement)
 * @param {string} projectId - ID du projet
 * @returns {Object} Projet avec détails
 */
export async function getProjectById(projectId) {
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.due_date,
      p.category,
      p.client,
      p.testimonial,
      p.status_id,
      p.created_at,
      p.is_visible,
      pr.username as creator_username,
      pr.bio as creator_bio,
      pr.id as creator_profile_id,
      COUNT(pt.id) as participant_count
    FROM public.projects p
    LEFT JOIN public.project_participants pp ON pp.project_id = p.id AND pp.role_id = 1
    LEFT JOIN public.profiles pr ON pr.id = pp.profile_id
    LEFT JOIN public.project_participants pt ON pt.project_id = p.id
    WHERE p.id = $1
    GROUP BY p.id, p.title, p.description, p.due_date, p.category, p.client, p.testimonial, p.status_id, p.created_at, p.is_visible, pr.username, pr.bio, pr.id
  `;

  try {
    const result = await pool.query(query, [projectId]);
    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Project not found",
        errorKey: 100007,
        errorCode: "project-not-found"
      };
    }
    return {
      success: true,
      data: result.rows[0]
    };
  } catch (error) {
    console.log('=== error === admin.service.js === getProjectById === key: 100008 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error fetching project",
      errorKey: 100008,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

/**
 * Toggle la visibilité d'un projet
 * @param {string} projectId - ID du projet
 * @returns {Object} Résultat de l'opération
 */
export async function toggleProjectVisibility(projectId) {
  const query = `
    UPDATE public.projects 
    SET is_visible = NOT is_visible
    WHERE id = $1
    RETURNING id, title, is_visible
  `;

  try {
    const result = await pool.query(query, [projectId]);
    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Project not found",
        errorKey: 100009,
        errorCode: "project-not-found"
      };
    }
    return {
      success: true,
      data: result.rows[0],
      message: `Project "${result.rows[0].title}" ${result.rows[0].is_visible ? 'made visible' : 'hidden'} successfully`
    };
  } catch (error) {
    console.log('=== error === admin.service.js === toggleProjectVisibility === key: 100010 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error updating project visibility",
      errorKey: 100010,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}
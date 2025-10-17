import pool from "#database/database.js";
import Config from "#config";
import { v4 as uuidv4 } from "uuid";

/**
 * Get all profiles for a user
 * @param {string} userId - User ID
 */
export async function getProfilesByUserId(userId) {
  const query = `
    SELECT 
      p.*,
      pt.type_name as type
    FROM public.profiles p
    LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
    WHERE p.user_id = $1
  `;
  
  try {
    const { rows } = await pool.query(query, [userId]);
    return rows || [];
  } catch (error) {
    console.error("Error getting profiles by user ID:", error);
    return [];
  }
}

/**
 * Récupère un profil complet par son ID (sans wallet)
 * @param {string} profileId - UUID du profil
 */
export async function getProfileById(profileId) {
  const query = `
    SELECT 
      p.*,
      pt.type_name AS profile_type,
      u.email AS user_email,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'project_id', pp.project_id,
            'role_name', pr.role_name,
            'contribution', pp.contribution,
            'contribution_description', pp.contribution_description
          )
        ) FILTER (WHERE pp.id IS NOT NULL), '[]'
      ) AS project_participations,
      (
        SELECT COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pl.id,
              'link_type', plt.name,
              'url', pl.url,
              'link_label', pl.link_label,
              'created_at', pl.created_at
            )
          ) FILTER (WHERE pl.id IS NOT NULL), '[]'::jsonb
        )
        FROM public.profile_links pl
        LEFT JOIN public.profile_link_type plt ON plt.id = pl.link_type_id
        WHERE pl.profile_id = p.id
      ) AS links
    FROM public.profiles p
    LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
    LEFT JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.project_participants pp ON pp.profile_id = p.id
    LEFT JOIN public.project_participant_role pr ON pr.id = pp.role_id
    WHERE p.id = $1 AND u.is_enabled = true
    GROUP BY p.id, pt.type_name, u.email
    LIMIT 1;
  `;
  let queryResponse;
  try {
    queryResponse = await pool.query(query, [profileId]);
  } catch (error) {
    console.log('=== error === profiles.service.js === key: 832949 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while fetching profile",
      errorKey: 507407,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
  const { rows } = queryResponse;
  return rows[0] || null;
}

/**
 * Récupère un profil complet par son username
 * @param {string} username - username du profil
 */
export async function getProfileByUsername(username) {
  const query = `
    SELECT 
      p.*,
      pt.type_name AS profile_type,
      u.email AS user_email,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'project_id', pp.project_id,
            'role_name', pr.role_name,
            'contribution', pp.contribution,
            'contribution_description', pp.contribution_description
          )
        ) FILTER (WHERE pp.id IS NOT NULL), '[]'
      ) AS project_participations,
      (
        SELECT COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pl.id,
              'link_type', plt.name,
              'url', pl.url,
              'link_label', pl.link_label,
              'created_at', pl.created_at
            )
          ) FILTER (WHERE pl.id IS NOT NULL), '[]'::jsonb
        )
        FROM public.profile_links pl
        LEFT JOIN public.profile_link_type plt ON plt.id = pl.link_type_id
        WHERE pl.profile_id = p.id
      ) AS links
    FROM public.profiles p
    LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
    LEFT JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.project_participants pp ON pp.profile_id = p.id
    LEFT JOIN public.project_participant_role pr ON pr.id = pp.role_id
    WHERE p.username = $1 AND u.is_enabled = true
    GROUP BY p.id, pt.type_name, u.email
    LIMIT 1;
  `;
  let queryResponse;
  try {
    queryResponse = await pool.query(query, [username]);
  } catch (error) {
    console.log('=== error === profiles.service.js === key: 889896 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while fetching profile by username",
      errorKey: 294724,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
  const { rows } = queryResponse;
  return rows[0] || null;
}

/**
 * Get all profiles from all users (for authenticated users only)
 * Used for selecting collaborators, clients, etc. in projects
 */
export const getAllProfiles = async () => {
  const query = `
    SELECT 
      p.id,
      p.user_id,
      p.first_name,
      p.last_name,
      p.username,
      p.avatar_url,
      p.bio,
      p.expertise,
      p.collectif_name,
      pt.type_name AS profile_type
    FROM public.profiles p
    LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
    LEFT JOIN public.users u ON u.id = p.user_id
    WHERE u.is_enabled = true
    ORDER BY p.username ASC
  `;
  
  try {
    const { rows } = await pool.query(query);
    return rows || [];
  } catch (error) {
    console.error("Error getting all profiles:", error);
    return {
      success: false,
      message: "Error fetching profiles",
      errorKey: 500301,
      errorCode: "profiles-fetch-error",
      fromError: !Config.IN_PROD ? error.message : null
    };
  }
};

/**
 * Récupère tous les profils d'un utilisateur
 */
export const getAllProfilesByUserId = async (userId) => {
  const query = `
    SELECT 
      p.*,
      pt.type_name AS profile_type,
      u.email AS user_email,
      COALESCE(
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'project_id', pp.project_id,
            'profile_id', pp.profile_id,
            'role_name', pr.role_name,
            'contribution', pp.contribution,
            'contribution_description', pp.contribution_description
          )
        ) FILTER (WHERE pp.id IS NOT NULL), '[]'
      ) AS project_participations,
      (
        SELECT COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pl.id,
              'link_type', plt.name,
              'url', pl.url,
              'link_label', pl.link_label,
              'created_at', pl.created_at
            )
          ) FILTER (WHERE pl.id IS NOT NULL), '[]'::jsonb
        )
        FROM public.profile_links pl
        LEFT JOIN public.profile_link_type plt ON plt.id = pl.link_type_id
        WHERE pl.profile_id = p.id
      ) AS links
    FROM public.profiles p
    LEFT JOIN public.profile_type pt ON pt.id = p.profile_type_id
    LEFT JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.project_participants pp ON pp.profile_id = p.id
    LEFT JOIN public.project_participant_role pr ON pr.id = pp.role_id
    WHERE p.user_id = $1 AND u.is_enabled = true
    GROUP BY p.id, pt.type_name, u.email;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Crée un nouveau profil de type "individual" (profile_type_id = 1)
 */
export const createProfile = async ( profileData) => {
  const { userId, accountType, firstName, lastName, username, bio, avatarUrl, entreprise } = profileData;
  const query = `
    INSERT INTO profiles (id, user_id, first_name, last_name, username, bio, avatar_url, profile_type_id, collectif_name, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [
      uuidv4(),
      userId,
      firstName,
      lastName,
      username,
      bio || '',
      avatarUrl,
      accountType === "individual" ? 1 : 2,
      entreprise || "",
    ]);
    return result.rows[0];
  } catch (error) {
    // Handle duplicate username constraint violation
    if (error.code === '23505' && error.constraint === 'profiles_username_key') {
      return {
        success: false,
        message: `Username "${username}" is already taken. Please choose a different username.`,
        errorCode: "username-already-exists",
        errorKey: 409001
      };
    }
    
    // Handle other constraint violations
    if (error.code === '23505') {
      return {
        success: false,
        message: "A profile with these details already exists",
        errorCode: "duplicate-profile",
        errorKey: 409002
      };
    }
    
    console.log('=== error === profiles.service.js === createProfile === key: 500201 ===');
    console.dir(error, { depth: null, colors: true });
    console.log('=================================');
    
    return {
      success: false,
      message: "Error creating profile",
      errorCode: "profile-creation-error",
      errorKey: 500201,
      fromError: !Config.IN_PROD ? error.message : null
    };
  }
};

/**
 * Change le profil actif
 */
export const switchProfile = async (profileId) => {
  const query = `
    UPDATE profiles
    SET is_active = true
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [profileId]);

  if (result.rowCount === 0) {
    throw new Error("Profile not found");
  }

  return result.rows[0];
};

/**
 * Vérifie dans ce service si le username existe déjà pour un autre id de profile
 */
export const usernameExists = async (username, profileId) => {
  let query;
  let values;

  if (profileId) {
    query = `
      SELECT COUNT(*) FROM profiles WHERE username = $1 AND id != $2
    `;
    values = [username, profileId];
  } else {
    query = `
      SELECT COUNT(*) FROM profiles WHERE username = $1
    `;
    values = [username];
  }

  const result = await pool.query(query, values);
  return Number(result.rows[0].count) > 0;
};

/**
 * Met à jour un profil existant ainsi que ses liens sociaux (si fournis).
 */
export const updateProfile = async (profileId, profileData) => {
  const {
    firstName,
    lastName,
    username,
    bio,
    avatarUrl,
    bannerUrl,
    expertise,
    links,
  } = profileData;
  try {
    await pool.query("BEGIN");

    // Mise à jour du profil
    const query = `
      UPDATE profiles
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        username = COALESCE($3, username),
        bio = COALESCE($4, bio),
        avatar_url = COALESCE($5, avatar_url),
        banner_url = COALESCE($6, banner_url),
        expertise = COALESCE($7, expertise),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    let result;
    try {
      result = await pool.query(query, [
        firstName,
        lastName,
        username,
        bio,
        avatarUrl,
        bannerUrl,
        expertise,
        profileId,
      ]);
    } catch (error) {
      console.log('=== error === profiles.service.js === key: 047452 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
      return {
        success: false,
        message: "Error while updating profile",
        errorKey: 566749,
        fromError: !Config.IN_PROD ? error.message : null,
      };
    }
    if (!result.rowCount || result.rowCount === 0) {
      await pool.query("ROLLBACK");
      return null;
    }
    let updatedProfile = result.rows[0];

    updatedProfile.links = links;

    if (links && Array.isArray(links)) {
      // Supprime les liens existants pour ce profil
      await pool.query("DELETE FROM profile_links WHERE profile_id = $1", [
        profileId,
      ]);
      // Insère chaque lien fourni
      for (const link of links) {
        const insertQuery = `
          INSERT INTO profile_links (id, profile_id, link_type_id, url, link_label, created_at)
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            NOW()
          )
        `;
        const linkTypeIdResult = await pool.query(
          "SELECT id FROM profile_link_type WHERE name = $1",
          [link.link_type]
        );
        if (linkTypeIdResult.rowCount === 0) {
          await pool.query("ROLLBACK");
          return {
            success: false,
            message: `Invalid link type: ${link.link_type}`,
            errorKey: 123456,
          };
        }
        const linkTypeId = linkTypeIdResult.rows[0].id;
        try {
          await pool.query(insertQuery, [
            profileId,
            linkTypeId,
            link.url,
            link.link_label,
          ]);
        } catch (error) {
          console.log("=== error === profiles.service.js === key: 768735 ===");
          console.dir(error, { depth: null, colors: true });
          console.log("=================================");
        }
      }
    }
    await pool.query("COMMIT");
    return updatedProfile;
  } catch (error) {
    await pool.query("ROLLBACK");
    console.log("=== error === profiles.service.js === key: 551359 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
    return {
      success: false,
      message: "Error while updating profile",
      errorKey: 735293,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
};

/**
 * Supprime un profil (ou le marque comme supprimé)
 */
export const deleteProfile = async (profileId) => {
  const query = `DELETE FROM profiles WHERE id = $1`;
  const result = await pool.query(query, [profileId]);
  return result.rowCount && result.rowCount > 0;
};

//path: src/services/network.service.js

import pool from "#database/database.js";
import Config from "#config";

/**
 * Récupère toutes les informations nécessaires pour construire
 * la "toile" (network) des projets et participants.
 */
export async function getNetworkData() {
  const query = `
      SELECT 
        p.id AS project_id,
        p.title,
        p.created_at AS project_created_at,
        
        -- Participants / Profils
        pr.id AS profile_id,
        pr.first_name,
        pr.last_name,
        pr.expertise,
        pr.avatar_url,
        pr.collectif_name,
        pt.type_name AS account_type,
        
        -- Rôles
        ppr.role_name
        
      FROM projects p
      LEFT JOIN project_participants pp
        ON p.id = pp.project_id
      LEFT JOIN profiles pr
        ON pp.profile_id = pr.id
      LEFT JOIN users u
        ON pr.user_id = u.id
      LEFT JOIN profile_type pt
        ON pr.profile_type_id = pt.id
      LEFT JOIN project_participant_role ppr
        ON pp.role_id = ppr.id
        WHERE p.status_id = 4 AND pr.profile_type_id = 1 AND p.is_visible = true AND u.is_enabled = true
      ORDER BY p.created_at DESC;
    `;

  let queryResponse;

  try {
    queryResponse = await pool.query(query);
    return queryResponse.rows || [];
  } catch (error) {
    console.log("=== error === network.service.js === key: 153028 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
    return {
      success: false,
      message: "Error while fetching network",
      errorKey: 171764,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
}

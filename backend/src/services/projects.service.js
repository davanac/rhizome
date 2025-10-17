//path: src/services/projects.service.js
import pool from "#database/database.js";
import Config from "#config";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { ethers } from "ethers";

// Récupérer tous les projets (uniquement ceux en statut "completed")
export const getAllProjects = async (projectStatuses) => {


  const query = `    
    WITH completed_projects AS (
      SELECT *
      FROM projects
      WHERE status_id IN (${projectStatuses}) 
        AND is_visible = true
    )
      SELECT
      cp.id AS project_id,
      cp.title,
      cp.description,
      cp.due_date,
      cp.banner_url AS banner_url,
      cp.category,
      cp.client,
      cp.testimonial,
      cp.status_id,
      cp.stringified,
      cp.hash,
      cp.url,
      cp.nft_img,
      cp.created_at AS project_created_at,
      pr.id AS profile_id,
      pr.first_name,
      pr.last_name,
      pr.username,
      pr.avatar_url,
      pr.banner_url AS profile_banner_url,
      pr.bio,
      pr.expertise,
      pr.collectif_name,
      pp.id AS participant_id,
      pp.contribution,
      pp.contribution_description,
      pp.is_signed,
      pp.signature,
      ppr.role_name,
      pt.type_name
    FROM completed_projects cp
    LEFT JOIN project_participants pp ON cp.id = pp.project_id
    LEFT JOIN profiles pr ON pr.id = pp.profile_id
    LEFT JOIN users u ON u.id = pr.user_id
    LEFT JOIN project_participant_role ppr ON ppr.id = pp.role_id
    LEFT JOIN profile_type pt ON pt.id = pr.profile_type_id
    WHERE u.is_enabled = true OR u.id IS NULL
    ORDER BY cp.created_at DESC;
  `;

  try {
    const result = await pool.query(query);
    return result.rows || [];
  } catch (error) {
    console.log('=== error === projects.service.js === key: 244134 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while fetching all projects",
      errorKey: 108904,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
};

// Créer un projet
export const _createProject = async (userId, projectData) => {
  const { title, description, dueDate, statusId } = projectData;
  const query = `
    INSERT INTO projects (user_id, title, description, due_date, status_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *
  `;
  const result = await pool.query(query, [
    userId,
    title,
    description,
    dueDate,
    statusId,
  ]);
  return result.rows[0];
};

export const createProject = async (projectId, projectData, authorProfile) => {
  console.log("=== projectId === projects.service.js === key: 872679 ===");
  console.dir(projectId, { depth: null, colors: true });
  console.dir(projectData, { depth: null, colors: true });
  console.log("=================================");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updateProjectQuery = `
      UPDATE projects
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date),
        banner_url = COALESCE($4, banner_url),
        category = COALESCE($5, category),
        client = COALESCE($6, client),
        testimonial = COALESCE($7, testimonial),
        url = COALESCE($8, url),
        nft_img = COALESCE($9, nft_img)
      WHERE id = $10
      RETURNING *
    `;

    const insertProjectQuery = `
    INSERT INTO projects (id,title, description, due_date, banner_url, category, client, testimonial,url,nft_img, status_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
`;

    const updateProjectValues = [
      projectId.toString(),
      projectData.title,
      projectData.description,
      projectData.dueDate,
      projectData.thumbnail,
      projectData.category,
      projectData.client,
      projectData.testimonial,
      projectData.url || "",
      projectData.nftImg || "",
      1,
    ];
    const projectResult = await client.query(
      insertProjectQuery,
      updateProjectValues
    );
    if (projectResult.rowCount === 0) {
      throw new Error("Project not found");
    }

    const deleteLinksQuery = `DELETE FROM project_links WHERE project_id = $1`;
    await client.query(deleteLinksQuery, [projectId]);

    if (
      projectData.links &&
      Array.isArray(projectData.links) &&
      projectData.links.length > 0
    ) {
      const validLinks = projectData.links.filter(
        (link) => link && typeof link.url === "string" && link.url.trim() !== ""
      );
      if (validLinks.length > 0) {
        const insertLinkQuery = `INSERT INTO project_links (id, project_id, url) VALUES ($1, $2, $3)`;
        for (let link of validLinks) {
          await client.query(insertLinkQuery, [
            uuidv4(),
            projectId,
            link.url.trim(),
          ]);
        }
      }
    }

    const deleteParticipantsQuery = `DELETE FROM project_participants WHERE project_id = $1`;
    await client.query(deleteParticipantsQuery, [projectId]);

    const teamLeader = { profile: projectData.author.profile };
    teamLeader.contribution = projectData.author.contribution;
    teamLeader.contributionDescription =
      projectData.author.contributionDescription;

    const insertTeamLeaderQuery = `
        INSERT INTO project_participants (id, project_id, profile_id, role_id, contribution, contribution_description, created_at, is_signed)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
      `;

    await client.query(insertTeamLeaderQuery, [
      uuidv4(),
      projectId,
      teamLeader.profile,
      1,
      teamLeader.contribution,
      teamLeader.contributionDescription,
    ]);

    if (
      projectData.participants &&
      Array.isArray(projectData.participants) &&
      projectData.participants.length > 0
    ) {
      const insertParticipantQuery = `
        INSERT INTO project_participants (id, project_id, profile_id, role_id, contribution, contribution_description, created_at, is_signed)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
      `;
      for (let participant of projectData.participants) {
        await client.query(insertParticipantQuery, [
          uuidv4(),
          projectId,
          participant.profile,
          2,
          participant.contribution,
          participant.contributionDescription,
        ]);
      }

      for (let observer of projectData.observers) {
        await client.query(insertParticipantQuery, [
          uuidv4(),
          projectId,
          observer.profile,
          3,
          0,
          "",
        ]);
      }
      /** ------------------ cmt 585326 ------------------
      await client.query(insertParticipantQuery, [
        uuidv4(),
        projectId,
        projectData.author.profile,
        1,
        projectData.author.contribution,
        projectData.author.contributionDescription,
      ]);
      *-------------------------------------------------*/
    }

    await client.query("COMMIT");
    return projectResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("=== error === projects.service.js === key: 872204 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
    return {
      success: false,
      message: "Error while updating project",
      errorKey: 298671,
      errorCode: "error-while-updating-project",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  } finally {
    client.release();
  }
};

// Récupérer un projet spécifique avec ses participants (uniquement s'il est completed)
export const getProjectById = async (projectId, projectStatuses) => {
  const query = `
    SELECT
      p.id AS project_id,
      p.title,
      p.description,
      p.due_date,
      p.banner_url AS banner_url,
      p.category,
      p.client,
      p.testimonial,
      p.stringified,
      p.hash,
      p.status_id,
      p.url,
      p.nft_img,
      p.created_at AS project_created_at,

      (
        SELECT COALESCE(json_agg(json_build_object('id', pl.id, 'url', pl.url)), '[]'::json)
        FROM project_links pl
        WHERE pl.project_id = p.id
      ) AS project_links,
      
      pr.id AS profile_id,
      pr.first_name,
      pr.last_name,
      pr.username,
      pr.avatar_url,
      pr.banner_url AS profile_banner_url,
      pr.bio,
      pr.expertise,
      pr.collectif_name,
      pp.id AS participant_id,
      pp.contribution,
      pp.contribution_description,
      pp.is_signed,
      pp.signature,
      ppr.role_name,
      pt.type_name,
      ps.status_name,
      w3a.wallet_address
    FROM projects p
    LEFT JOIN project_status ps ON ps.id = p.status_id
    LEFT JOIN project_participants pp ON p.id = pp.project_id
    LEFT JOIN profiles pr ON pr.id = pp.profile_id
    LEFT JOIN users u ON u.id = pr.user_id
    LEFT JOIN web3auth_users w3a ON w3a.user_id = u.id
    LEFT JOIN project_participant_role ppr ON ppr.id = pp.role_id
    LEFT JOIN profile_type pt ON pt.id = pr.profile_type_id
    WHERE p.id = $1
      AND p.status_id IN (${projectStatuses})
      AND p.is_visible = true
      AND (u.is_enabled = true OR u.id IS NULL)
    ORDER BY p.created_at DESC;
  `;
  try {
    const result = await pool.query(query, [projectId]);

    return result.rows;
  } catch (error) {
    console.log('=== error === projects.service.js === key: 269909 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while fetching project by id",
      errorKey: 991812,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
};

// Mettre à jour un projet avec ses liens et participants
export const updateProject = async (projectId, projectData, authorProfile) => {
  console.log("=== projectId === projects.service.js === key: 641405 ===");
  console.dir(projectId, { depth: null, colors: true });
  console.dir(projectData, { depth: null, colors: true });
  console.log("=================================");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updateProjectQuery = `
      UPDATE projects
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date = COALESCE($3, due_date),
        banner_url = COALESCE($4, banner_url),
        category = COALESCE($5, category),
        client = COALESCE($6, client),
        testimonial = COALESCE($7, testimonial),
        url = COALESCE($8, url),
        nft_img = COALESCE($9, nft_img)
      WHERE id = $10
      RETURNING *
    `;
    const updateProjectValues = [
      projectData.title,
      projectData.description,
      projectData.dueDate,
      projectData.thumbnail,
      projectData.category,
      projectData.client,
      projectData.testimonial,
      projectData.url || "",
      projectData.nftImg || "",
      projectId.toString(),
    ];
    const projectResult = await client.query(
      updateProjectQuery,
      updateProjectValues
    );
    if (projectResult.rowCount === 0) {
      throw new Error("Project not found");
    }

    const deleteLinksQuery = `DELETE FROM project_links WHERE project_id = $1`;
    await client.query(deleteLinksQuery, [projectId]);

    if (
      projectData.links &&
      Array.isArray(projectData.links) &&
      projectData.links.length > 0
    ) {
      const validLinks = projectData.links.filter(
        (link) => link && typeof link.url === "string" && link.url.trim() !== ""
      );
      if (validLinks.length > 0) {
        const insertLinkQuery = `INSERT INTO project_links (id, project_id, url) VALUES ($1, $2, $3)`;
        for (let link of validLinks) {
          await client.query(insertLinkQuery, [
            uuidv4(),
            projectId,
            link.url.trim(),
          ]);
        }
      }
    }

    //Le projet est terminé, on ne peut plus changer les participants.
    if (projectData?.statusId === 4) {
      await client.query("COMMIT");
      return projectResult.rows[0];
    }

    const deleteParticipantsQuery = `DELETE FROM project_participants WHERE project_id = $1`;
    await client.query(deleteParticipantsQuery, [projectId]);

    const teamLeader = { profile: projectData.author.profile };
    teamLeader.contribution = projectData.author.contribution;
    teamLeader.contributionDescription =
      projectData.author.contributionDescription;

    const insertTeamLeaderQuery = `
        INSERT INTO project_participants (id, project_id, profile_id, role_id, contribution, contribution_description, created_at, is_signed)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
      `;

    await client.query(insertTeamLeaderQuery, [
      uuidv4(),
      projectId,
      teamLeader.profile,
      1,
      teamLeader.contribution,
      teamLeader.contributionDescription,
    ]);

    if (
      (projectData.participants &&
        Array.isArray(projectData.participants) &&
        projectData.participants.length > 0) ||
      (projectData.observers &&
        Array.isArray(projectData.observers) &&
        projectData.observers.length > 0)
    ) {
      const insertParticipantQuery = `
        INSERT INTO project_participants (id, project_id, profile_id, role_id, contribution, contribution_description, created_at, is_signed)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
      `;
      for (let participant of projectData.participants) {
        await client.query(insertParticipantQuery, [
          uuidv4(),
          projectId,
          participant.profile,
          2,
          participant.contribution,
          participant.contributionDescription,
        ]);
      }

      console.log(
        "=== projectData.observers === projects.service.js === key: 238764 ==="
      );
      console.dir(projectData.observers, { depth: null, colors: true });
      console.log("=================================");

      for (let observer of projectData.observers || []) {
        console.log("=== observer === projects.service.js === key: 625603 ===");
        console.dir(observer, { depth: null, colors: true });
        console.log("=================================");
        await client.query(insertParticipantQuery, [
          uuidv4(),
          projectId,
          observer.profile,
          3,
          0,
          "",
        ]);
      }
      /** ------------------ cmt 067497 ------------------
      await client.query(insertParticipantQuery, [
        uuidv4(),
        projectId,
        projectData.author.profile,
        1,
        projectData.author.contribution,
        projectData.author.contributionDescription,
      ]);
      *-------------------------------------------------*/
    }

    await client.query("COMMIT");
    return projectResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("=== error === projects.service.js === key: 872204 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
    return {
      success: false,
      message: "Error while updating project",
      errorKey: 298671,
      errorCode: "error-while-updating-project",
      fromError: !Config.IN_PROD ? error.message : null,
    };
  } finally {
    client.release();
  }
};

export const updateProjectStatus = async (projectId, projectData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updateProjectQuery = `
      UPDATE projects
      SET 
        status_id = COALESCE($1, status_id)
      WHERE id = $2
      RETURNING *
    `;
    const updateProjectValues = [projectData.statusId, projectId.toString()];
    const projectResult = await client.query(
      updateProjectQuery,
      updateProjectValues
    );
    if (projectResult.rowCount === 0) {
      throw new Error("Project not found");
    }

    await client.query("COMMIT");
    return projectResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("=== error === projects.service.js === key: 872204 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
    return {
      success: false,
      message: "Error while updating project status",
      errorCode: "error-while-updating-project-status",
      errorKey: 605093,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  } finally {
    client.release();
  }
};

export const getParticipantByProjectAndProfile = async (
  projectId,
  profileId
) => {
  const query = `
    SELECT pp.*, ppr.role_name
    FROM project_participants pp
    JOIN project_participant_role ppr ON ppr.id = pp.role_id
    WHERE pp.project_id = $1 AND pp.profile_id = $2 AND pp.role_id IN (1, 2)
    LIMIT 1
  `;
  try {
    const result = await pool.query(query, [projectId, profileId]);
    if (result.rowCount === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.log('=== error === projects.service.js === key: 734512 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return null;
  }
};

export const signProject = async (projectId, participantId, signature) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updateQuery = `
      UPDATE project_participants
      SET signature = $1, is_signed = true, signed_at = NOW()
      WHERE project_id = $2 AND id = $3
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [
      signature,
      projectId,
      participantId,
    ]);
    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Participant not found or update failed",
      };
    }
    // Vérifier si tous les participants éligibles ont signé
    const allSigned = await checkAllSignatures(client, projectId);
    if (allSigned) {
      const updateProjectQuery = `
        UPDATE projects
        SET status_id = 4
        WHERE id = $1
        RETURNING *
      `;
      await client.query(updateProjectQuery, [projectId]);
    }
    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.log('=== error === projects.service.js === key: 743917 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while signing project",
      errorKey: 555555,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  } finally {
    client.release();
  }
};

export const checkAllSignatures = async (client, projectId) => {
  if (!client) {
    client = await pool.connect();
  }
  const query = `
    SELECT COUNT(*) AS unsigned_count
    FROM project_participants pp
    JOIN project_participant_role ppr ON ppr.id = pp.role_id
    WHERE pp.project_id = $1 
      AND (ppr.role_name = 'contributor' OR ppr.role_name = 'teamLeader')
      AND (pp.is_signed IS NOT TRUE)
  `;
  try {
    const result = await client.query(query, [projectId]);
    const count = parseInt(result.rows[0].unsigned_count, 10);
    return count === 0;
  } catch (error) {
    console.log('=== error === projects.service.js === key: 452917 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    throw new Error("Error checking signatures");
  }
};

// Supprimer un projet
export const deleteProject = async (projectId) => {
  const query = `
    DELETE FROM projects
    WHERE id = $1
  `;
  const result = await pool.query(query, [projectId]);
  return result.rowCount > 0;
};

// Récupérer tous les projets liés à un profile_id
export const getProjectsByProfileId = async (profileId, projectStatuses) => {
  const query = `
    WITH user_projects AS (
      SELECT p.id
      FROM projects p
      JOIN project_participants pp ON p.id = pp.project_id
      WHERE pp.profile_id = $1 AND p.status_id IN (${projectStatuses}) AND p.is_visible = true 
    )
    SELECT
      p.id AS project_id,
      p.title,
      p.description,
      p.due_date,
      p.banner_url AS banner_url,
      p.category,
      p.client,
      p.testimonial,
      p.status_id,
      p.stringified,
      p.hash,
      p.url,
      p.nft_img,
      p.created_at AS project_created_at,
      
      pr.id AS profile_id,
      pr.first_name,
      pr.last_name,
      pr.username,
      pr.avatar_url,
      pr.banner_url AS profile_banner_url,
      pr.bio,
      pr.expertise,
      pr.collectif_name,
      pp.id AS participant_id,
      pp.contribution,
      pp.contribution_description,
      pp.is_signed,
      pp.signature,
      pt.type_name,
      ppr.role_name
    FROM projects p
    JOIN project_participants pp ON p.id = pp.project_id
    JOIN project_participant_role ppr ON ppr.id = pp.role_id
    JOIN profiles pr ON pr.id = pp.profile_id
    JOIN users u ON u.id = pr.user_id
    LEFT JOIN profile_type pt ON pt.id = pr.profile_type_id
    WHERE p.id IN (
      SELECT id FROM user_projects
    ) AND u.is_enabled = true
    ORDER BY p.created_at DESC;
  `;

  try {
    const result = await pool.query(query, [profileId]);
    return result.rows;
  } catch (error) {
    console.log('=== error === projects.service.js === key: 824428 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while fetching projects by profile ID",
      errorKey: 792089,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
};

// =================== NOUVELLES FONCTIONS POUR FREEZE / UNFREEZE ===================

export const freezeProject = async (projectId) => {

  console.log('=== projectId freezeProject === projects.service.js === key: 285632 ===');
  console.dir(projectId, { depth: null, colors: true })
  console.log('=================================');
  // Récupérer les données principales du projet
  const projectQuery =
    "SELECT id, description, url FROM projects WHERE id = $1";
  const projectResult = await pool.query(projectQuery, [projectId]);
  if (projectResult.rowCount === 0) throw new Error("Project not found");
  const projectData = projectResult.rows[0];

  // Récupérer les participants du projet
  const participantsQuery =
    `SELECT 
      pp.id, 
      pp.profile_id, 
      pp.contribution, 
      pp.contribution_description,
      w3a.wallet_address
    FROM 
      project_participants pp
    JOIN 
      profiles p ON p.id = pp.profile_id
    JOIN
      web3auth_users w3a ON w3a.user_id = p.user_id
    WHERE 
      pp.project_id = $1
      AND pp.role_id IN (1, 2);
    `;

    console.log('=== participantsQuery === projects.service.js === key: 268535 ===');
    console.dir(participantsQuery, { depth: null, colors: true })
    console.log('=================================');

    let participantsResult;
  try {
     participantsResult = await pool.query(participantsQuery, [projectId]);
  } catch (error) {
    console.log('=== error === projects.service.js === key: 739999 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
  }

  console.log('=== participantsResult === projects.service.js === key: 308129 ===');
  console.dir(participantsResult, { depth: null, colors: true })
  console.log('=================================');


  const participants = participantsResult.rows;

  console.log('=== participants === projects.service.js === key: 597217 ===');
  console.dir(participants, { depth: null, colors: true })
  console.log('=================================');

  const pps = participants.map((participant) => {
    return {
      id: participant.id,
      profile_id: participant.profile_id,
      contribution: participant.contribution,
      contribution_description: participant.contribution_description,
      wallet_address: participant.wallet_address,
    };
  });

  // Construire l'objet JSON représentatif
  const freezeObject = {
    id: projectData.id,
    description: projectData.description,
    participants: pps,
  };

  console.log("=== freezeObject === projects.service.js === key: 027386 ===");
  console.dir(freezeObject, { depth: null, colors: true });
  console.log("=================================");

  const freezeJSON = JSON.stringify(freezeObject);
  //let hash = crypto.createHash("sha256").update(freezeJSON).digest("hex");
  //hash = ethers.keccak256(ethers.toUtf8Bytes(freezeJSON));

  const hash = ethers.sha256(ethers.toUtf8Bytes(freezeJSON));

  console.log("=== hash === projects.service.js === key: 540909 ===");
  console.dir(hash, { depth: null, colors: true });
  console.log("=================================");

  // Mettre à jour le projet avec le JSON et le hash
  const updateQuery =
    "UPDATE projects SET stringified = $1, hash = $2 WHERE id = $3 RETURNING *";
  const updateResult = await pool.query(updateQuery, [
    freezeJSON,
    hash,
    projectId,
  ]);
  return updateResult.rows[0];
};

export const unfreezeProject = async (projectId) => {
  // Supprimer le JSON et le hash du projet
  const updateQuery =
    "UPDATE projects SET stringified = NULL, hash = NULL WHERE id = $1 RETURNING *";
  const updateResult = await pool.query(updateQuery, [projectId]);

  // Réinitialiser les signatures des participants du projet
  const updateParticipantsQuery =
    "UPDATE project_participants SET signature = NULL, is_signed = false, signed_at = NULL WHERE project_id = $1";
  await pool.query(updateParticipantsQuery, [projectId]);

  return updateResult.rows[0];
};
/**
 *
 * @param {*} projectId
 * @returns
 */
export const getProjectSignatureData = async (projectId) => {
  const query = `
    SELECT id, stringified, hash
    FROM projects
    WHERE id = $1
  `;
  try {
    const result = await pool.query(query, [projectId]);
    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Project not found",
        errorCode: "project-not-found",
        errorKey: 867628,
      };
    }
    return result.rows[0];
  } catch (error) {
    console.log('=== error === projects.service.js === key: 768202 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Error while fetching project signature data",
      errorCode: "error-while-fetching-project-signature-data",
      errorKey: 541968,
      fromError: !Config.IN_PROD ? error.message : null,
    };
  }
};

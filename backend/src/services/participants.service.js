import pg from 'pg';
import pool from "#database/database.js";


// Récupérer tous les participants de tous les projets
export const getAllParticipants = async () => {
  const query = `
    SELECT 
      pp.*, 
      p.first_name, 
      p.last_name, 
      p.username,
      p.collectif_name
    FROM project_participants pp
    JOIN profiles p ON pp.profile_id = p.id
    JOIN users u ON u.id = p.user_id
    WHERE u.is_enabled = true
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Récupérer les participants d'un projet
export const getParticipantsByProjectId = async (projectId) => { 
  const query = `
    SELECT 
      pp.*, 
      p.first_name, 
      p.last_name, 
      p.username,
      p.collectif_name
    FROM project_participants pp
    JOIN profiles p ON pp.profile_id = p.id
    JOIN users u ON u.id = p.user_id
    WHERE pp.project_id = $1 AND u.is_enabled = true
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows;
};

// Ajouter un participant à un projet
export const addParticipantToProject = async (projectId, participantData) => {
  const { profile_id, role_id, contribution, contribution_description } = participantData;
  const query = `
    INSERT INTO project_participants (
      project_id, profile_id, role_id, contribution, contribution_description, created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const result = await pool.query(query, [
    projectId, profile_id, role_id, contribution, contribution_description
  ]);
  return result.rows[0];
};

// Récupérer un participant spécifique d'un projet
export const getParticipantById = async (projectId, participantId) => {
  const query = `
    SELECT 
      pp.*, 
      p.first_name, 
      p.last_name, 
      p.username,
      p.collectif_name
    FROM project_participants pp
    JOIN profiles p ON pp.profile_id = p.id
    JOIN users u ON u.id = p.user_id
    WHERE pp.project_id = $1 AND pp.id = $2 AND u.is_enabled = true
  `;
  const result = await pool.query(query, [projectId, participantId]);
  return result.rowCount > 0 ? result.rows[0] : null;
};

// Mettre à jour un participant d'un projet
export const updateParticipant = async (projectId, participantId, updates) => {
  const { role_id, contribution, contribution_description } = updates;
  const query = `
    UPDATE project_participants
    SET 
      role_id = COALESCE($1, role_id),
      contribution = COALESCE($2, contribution),
      contribution_description = COALESCE($3, contribution_description),
      updated_at = NOW()
    WHERE project_id = $4 AND id = $5
    RETURNING *
  `;
  const result = await pool.query(query, [
    role_id, contribution, contribution_description, projectId, participantId
  ]);
  return result.rowCount > 0 ? result.rows[0] : null;
};

export const setNFT = async (projectId, participantId, updates) => {
  const { nft_address, nft_token_id, nft_token_uri } = updates;
  const query = `
    UPDATE project_participants
    SET 
      nft_address = COALESCE($1, nft_address),
      nft_token_id = COALESCE($2, nft_token_id),
      nft_token_uri = COALESCE($3, nft_token_uri)
    WHERE project_id = $4 AND id = $5
    RETURNING *
  `;
  const result = await pool.query(query, [
    nft_address, nft_token_id,nft_token_uri, projectId, participantId
  ]);
  return result.rowCount > 0 ? result.rows[0] : null;
};

// Supprimer un participant d'un projet
export const removeParticipantFromProject = async (projectId, participantId) => {
  const query = `
    DELETE FROM project_participants
    WHERE project_id = $1 AND id = $2
  `;
  const result = await pool.query(query, [projectId, participantId]);
  return result.rowCount > 0;
};

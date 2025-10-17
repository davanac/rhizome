//path:  src/controllers/participants.controller.js
import * as ParticipantsService from '#services/participants.service.js';

// Récupérer tous les participants d'un projet
export const getParticipants = async (req, reply) => {
  const { projectId } = req.params;

  const participants = await ParticipantsService.getParticipantsByProjectId(projectId);
  reply.send(participants);
};

// Ajouter un participant à un projet
export const addParticipant = async (req, reply) => {
  const { projectId } = req.params;
  const { profile_id, role_id, contribution, contribution_description } = req.body;

  const newParticipant = await ParticipantsService.addParticipantToProject(projectId, {
    profile_id,
    role_id,
    contribution,
    contribution_description,
  });

  reply.status(201).send(newParticipant);
};

// Récupérer un participant spécifique
export const getParticipant = async (req, reply) => {
  const { projectId, participantId } = req.params;

  const participant = await ParticipantsService.getParticipantById(projectId, participantId);
  if (!participant) {
    return reply.status(404).send({ error: 'Participant not found' });
  }

  reply.send(participant);
};

// Mettre à jour un participant
export const updateParticipant = async (req, reply) => {
  const { projectId, participantId } = req.params;
  const updates = req.body;

  const updatedParticipant = await ParticipantsService.updateParticipant(projectId, participantId, updates);
  if (!updatedParticipant) {
    return reply.status(404).send({ error: 'Participant not found or update failed' });
  }

  reply.send(updatedParticipant);
};

// Retirer un participant d'un projet
export const deleteParticipant = async (req, reply) => {
  const { projectId, participantId } = req.params;

  const result = await ParticipantsService.removeParticipantFromProject(projectId, participantId);
  if (!result) {
    return reply.status(404).send({ error: 'Participant not found or delete failed' });
  }

  reply.status(204).send();
};

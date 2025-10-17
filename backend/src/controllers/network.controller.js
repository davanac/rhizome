//path: src/controllers/network.controller.js

import * as NetworkService from '#services/network.service.js';
import Config from '#config';

/**
 * GET "/"
 * Récupère la liste des projets et construit la structure attendue,
 * avec un groupement par projets et tri des participants par rôle.
 */
export async function getNetwork(req, reply) {
  try {
    const rawData = await NetworkService.getNetworkData();

    if(!rawData || rawData.success === false) {
      return reply.status(500).send({ 
        success: false,
        message: 'Error while fetching network',
        errorKey: 171764,
        fromError:  !Config.IN_PROD ? rawData : null,
      });
    }

    // On va créer un Map (ou un objet) pour regrouper les données par projet.
    const projectsMap = {};

    rawData.forEach((row) => {
      const projectId = row.project_id;

      // Initialise la structure du projet si elle n'existe pas encore
      if (!projectsMap[projectId]) {
        projectsMap[projectId] = {
          id: projectId,
          title: row.title,
          // On ne stocke plus de 'client' ici, car cette colonne a été retirée.

          // Placeholders pour les rôles
          team_leader: null,
          observers: [],
          contributors: [],
        };
      }

      // Construction de l'objet participant
      // (si row.profile_id est NULL => pas de participant sur la ligne)
      if (row.profile_id) {
        const participant = {
          id: row.profile_id,
          expertise: row.expertise,
          last_name: row.last_name,
          avatar_url: row.avatar_url,
          first_name: row.first_name,
          // Conversion du type_name en "individuel" / "collectif"
          account_type: row.account_type === 'individual' ? 'individuel' : 'collectif',
          'collectif-name': row.collectif_name,
        };

        // Classement selon le role_name
        switch (row.role_name) {
          case 'teamLeader':
            projectsMap[projectId].team_leader = participant;
            break;
          case 'contributor':
            projectsMap[projectId].contributors.push(participant);
            break;
          case 'observer':
            projectsMap[projectId].observers.push(participant);
            break;
          default:
            // Rôle non reconnu ou participant sans rôle
            break;
        }
      }
    });

    // Convertit la map d'objets en un tableau
    const projectsList = Object.values(projectsMap);

    // Réponse finale
    return reply.send(projectsList);
  } catch (error) {
    console.log('=== error === network.controller.js === key: 050427 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return reply.status(500).send({ 
      success: false,
      message: 'Error while fetching network',
      errorKey: 286683,
      fromError: !Config.IN_PROD ? error.message : null,
     });
  }
}

//path: src/controllers/projects.controller.js
import * as ProjectsService from "#services/projects.service.js";
import * as ProfilesService from "#services/profiles.service.js";
import * as BlockchainService from "#services/blockchain.service.js";
import * as ParticipantsService from "#services/participants.service.js";

import Config from "#config";
import { error } from "console";
import { v4 as uuidv4 } from "uuid";
import { stat } from "fs";
import { url } from "inspector";

const escapeForSolidityJSON = (str) => {
  return str
    .replace(/\\/g, "\\\\")   // Échappe les backslashes
    .replace(/"/g, '\\"')     // Échappe les guillemets doubles
    .replace(/\n/g, "\\n")    // Échappe les retours à la ligne
    .replace(/\r/g, "\\r")    // Échappe les retours chariot
    .replace(/\t/g, "\\t");   // Échappe les tabulations
};

const filterProjectsByUserAccess = async (projects, req) => {
  if (!req.user?.userId) {
    return projects;
  }

  const userId = req.user?.userId;
  const userProfiles = await ProfilesService.getAllProfilesByUserId(userId);



  if (!userProfiles || userProfiles.length === 0) {
    return [];
  }

  const userProfilesIds = userProfiles.map((profile) => profile.id);



  const filteredProjects = projects.filter((project) => {
    const projectParticipants = project.contributors.concat(project.observers);
    projectParticipants.push(project.team_leader);





    if (project.status_id === 4) {
      return true;
    }

    return projectParticipants.some((participant) => {

      return userProfilesIds.includes(participant?.profile_id);
    });
  });



  return filteredProjects || [];
};

// Récupérer tous les projets
export const getAllProjects = async (req, reply) => {
  const projectStatuses = req.user?.userId ? [1, 2, 3, 4] : [4];

  try {
    const rawData = await ProjectsService.getAllProjects(projectStatuses);
    if (rawData.success === false) {
      return reply.status(500).send({
        success: false,
        message: "Error while fetching all projects",
        errorKey: 936124,
        fromError: !Config.IN_PROD ? rawData : null,
      });
    }


    // Regroupement des lignes par projet
    const projectsMap = {};

    for (const row of rawData) {
      const projectId = row.project_id;

      if (!projectsMap[projectId]) {
        projectsMap[projectId] = {
          id: projectId,
          title: row.title,
          description: row.description,
          due_date: row.due_date,
          banner_url: row.banner_url,
          category: row.category,
          client: row.client,
          testimonial: row.testimonial,
          stringified: row.stringified,
          hash: row.hash,
          url: row.url||"",
          nft_img: row.nft_img||"",
          status_id: row.status_id,
          created_at: row.project_created_at,
          team_leader: null,
          contributors: [],
          observers: [],
        };
      }

      // Si le projet possède un participant, on construit l'objet participant
      if (row.participant_id) {
        const participant = {
          id: row.participant_id,
          profile_id: row.profile_id,
          first_name: row.first_name,
          last_name: row.last_name,
          username: row.username,
          avatar_url: row.avatar_url,
          banner_url: row.profile_banner_url,
          bio: row.bio,
          expertise: row.expertise,
          collectif_name: row.collectif_name,
          contribution: row.contribution,
          contribution_description: row.contribution_description,
        };

        // Répartition du participant selon son rôle
        switch (row.role_name) {
          case "teamLeader":
            projectsMap[projectId].team_leader = participant;
            break;
          case "contributor":
            projectsMap[projectId].contributors.push(participant);
            break;
          case "observer":
            projectsMap[projectId].observers.push(participant);
            break;
          default:
            projectsMap[projectId].contributors.push(participant);
        }
      }
    }

    const projectsList = Object.values(projectsMap);
    const filteredProjects = await filterProjectsByUserAccess(
      projectsList,
      req
    );
    reply.send(filteredProjects);
  } catch (error) {
    console.log('=== error === projects.controller.js === key: 978588 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return reply.status(500).send({
      success: false,
      message: "Error while fetching all projects",
      errorKey: 451022,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

// Créer un projet
export const createProject = async (req, reply) => {
  const projectId = uuidv4();

console.log('=== req.body === projects.controller.js === key: 534365 ===');
console.dir(req.body, { depth: null, colors: true })
console.log('=================================');

  if (!projectId) {
    return reply.status(400).send({
      success: false,
      message: "Missing projectId in request",
      errorCode: "missing-project-id",
      errorKey: 660056,
    });
  }

  const updateData = { ...(req.body || {}), status_id: 1, id: projectId,url: req.body.url+projectId+(req.body.slug||"") };
  const authorProfileId = updateData?.author?.profile;

  console.log('=== updateData === projects.controller.js === key: 513655 ===');
  console.dir(updateData, { depth: null, colors: true })
  console.log('=================================');

  if (!authorProfileId) {
    return {
      success: false,
      message: "Author profile ID is required",
      errorCode: "author-profile-id-required",
      errorKey: 542921,
    };
  }

  const authorProfile = await ProfilesService.getProfileById(authorProfileId);

  if (authorProfile?.user_id !== req.user?.userId) {
    return {
      success: false,
      message: "Unauthorized to update this project",
      errorCode: "unauthorized-update",
      errorKey: 493774,
    };
  }

  const createdProject = await ProjectsService.createProject(
    projectId,
    updateData,
    authorProfile
  );

  reply.send(createdProject);
};

// Récupérer un projet spécifique avec ses participants
export const getProject = async (req, reply) => {
  if (!req.params?.projectId) {
    return reply.status(400).send({
      success: false,
      message: "Missing projectId in request",
      errorKey: 538436,
    });
  }
  const { projectId } = req.params;

console.log('=== projectId  getProject === projects.controller.js === key: 466265 ===');
console.dir(projectId, { depth: null, colors: true })
console.log('=================================');

  // Allow unauthenticated users to see frozen projects (status 3) so they can sign
  // Status 4 = published/finalized (public), Status 3 = frozen (ready to sign)
  const projectStatuses = req.user?.userId ? [1, 2, 3, 4] : [3, 4];
  try {
    const rawData = await ProjectsService.getProjectById(
      projectId,
      projectStatuses
    );


    if (rawData?.success === false) {
      return {
        success: false,
        message: "Error while fetching project by id",
        errorKey: 337964,
        fromError: !Config.IN_PROD ? rawData : null,
      };
    }
    if (!rawData || rawData.length === 0) {
      return reply.status(404).send({
        success: false,
        message: "Project not found",
        errorKey: 135411,
        errorCode: "project-not-found",
      });
    }



    const project = {
      id: projectId,
      //participant_id: rawData[0].participant_id||"",
      title: rawData[0].title,
      description: rawData[0].description,
      due_date: rawData[0].due_date,
      banner_url: rawData[0].banner_url,
      category: rawData[0].category,
      client: rawData[0].client,
      testimonial: rawData[0].testimonial,
      status_id: rawData[0].status_id,
      status: rawData[0].status_name,
      created_at: rawData[0].project_created_at,
      project_links: rawData[0].project_links,
      stringified: rawData[0].stringified,
      hash: rawData[0].hash,
      url: rawData[0].url || "",
      nft_img: rawData[0].nft_img||"",
      team_leader: null,
      contributors: [],
      observers: [],
    };




    for (const row of rawData) {
      if (row.participant_id) {
        const participant = {
          id: row.participant_id,
          profile_id: row.profile_id,
          first_name: row.first_name,
          last_name: row.last_name,
          username: row.username,
          avatar_url: row.avatar_url,
          banner_url: row.profile_banner_url,
          bio: row.bio,
          expertise: row.expertise || "",
          contribution: row.contribution,
          contribution_description: row.contribution_description,
          collectif_name: row.collectif_name,
          type_name: row.type_name,
          is_signed: row.is_signed,
          signature: row.signature,
          wallet_address: row.wallet_address,
        };

        switch (row.role_name) {
          case "teamLeader":
            project.team_leader = participant;
            break;
          case "contributor":
            project.contributors.push(participant);
            break;
          case "observer":
            project.observers.push(participant);
            break;
          default:
            project.contributors.push(participant);
        }


      }
    }

    const filteredProjects = await filterProjectsByUserAccess([project], req);

    return filteredProjects[0];
  } catch (error) {
    console.log('=== error === projects.controller.js === key: 632867 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error fetching project",
      errorKey: 321035,
      fromError: !Config.IN_PROD ? error.message : null,
    });
  }
};

// Mettre à jour un projet
export const updateProject = async (req, reply) => {
  const { projectId } = req.params;

  if (!projectId) {
    return reply.status(400).send({
      success: false,
      message: "Missing projectId in request",
      errorCode: "missing-project-id",
      errorKey: 660056,
    });
  }

  const currentProject = await getProject(req, reply);


  if (currentProject.success === false || !currentProject) {
    return reply.status(404).send({
      success: false,
      message: "Project not found",
      errorCode: "project-not-found",
      errorKey: 351456,
    });
  }

  if (currentProject.status_id !== 1) {
    const errorMessage = currentProject.status_id === 3
      ? "Project is frozen and cannot be modified"
      : currentProject.status_id === 4
        ? "Project is completed and cannot be modified"
        : "Project is not in a modifiable state";

    return reply.status(403).send({
      success: false,
      message: errorMessage,
      errorCode: "project-not-modifiable",
      errorKey: 382692,
    });
  }

  

  const updateData = { ...(req.body || {}) };
  const authorProfileId = updateData?.author?.profile;

  console.log('=== updateData === projects.controller.js === key: 845956 ===');
  console.dir(updateData, { depth: null, colors: true })
  console.log('=================================');

  if (!authorProfileId) {
    return {
      success: false,
      message: "Author profile ID is required",
      errorCode: "author-profile-id-required",
      errorKey: 542921,
    };
  }

  // Project ownership is now verified by requireProjectOwnership middleware
  // Use the project from req.project to get author info if needed
  const authorProfile = await ProfilesService.getProfileById(authorProfileId);

  const updatedProject = await ProjectsService.updateProject(
    projectId,
    updateData,
    //authorProfile
  );

  reply.send(updatedProject);
};

// === MODIFICATION POUR LE FREEZE / UNFREEZE ===
export const updateProjectStatus = async (req, reply) => {
  const { projectId } = req.params;

  if (!projectId) {
    return reply.status(400).send({
      success: false,
      message: "Missing projectId in request",
      errorCode: "missing-project-id",
      errorKey: 870836,
    });
  }

  const projectStatuses = req.user?.userId ? [1, 2, 3, 4] : [4];
  const currentProjects = await ProjectsService.getProjectById(
    projectId,
    projectStatuses
  );
  if (
    currentProjects.success === false ||
    !currentProjects ||
    currentProjects.length === 0
  ) {
    return reply.status(404).send({
      success: false,
      message: "Project not found",
      errorCode: "project-not-found",
      errorKey: 768582,
    });
  }
  const oldStatus = currentProjects[0].status_id;

  const updateData = { ...(req.body || {}) };

  const authorProfileId = updateData?.author?.profile_id;
  if (!authorProfileId) {
    return reply.status(400).send({
      success: false,
      message: "Author profile ID is required",
      errorCode: "author-profile-id-required",
      errorKey: 246247,
    });
  }

  // Project ownership is now verified by requireProjectOwnership middleware

  const updatedProject = await ProjectsService.updateProjectStatus(
    projectId,
    updateData
  );
  const newStatus = updatedProject.status_id;

  if (oldStatus === 1 && newStatus === 3) {
    // Freeze project : créer le JSON représentatif, calculer le hash et les stocker
    const freezeResult = await ProjectsService.freezeProject(projectId);
    return reply.send(freezeResult);
  } else if (oldStatus === 3 && newStatus === 1) {
    // Unfreeze project : supprimer le JSON, le hash et réinitialiser les signatures
    const unfreezeResult = await ProjectsService.unfreezeProject(projectId);
    return reply.send(unfreezeResult);
  } else {
    return reply.send(updatedProject);
  }
};
// === FIN MODIFICATION POUR FREEZE / UNFREEZE ===

export const signProject = async (req, reply) => {
  const { projectId } = req.params;
  const { signature } = req.body;
  const profileId = req.body.profile?.id;

  if (!projectId || !signature) {
    return reply.status(400).send({
      success: false,
      message: "Missing projectId or signature in request",
      errorKey: 608353,
    });
  }
  // Supposons que req.user.profileId contient l'identifiant du profil de l'utilisateur
  if (!profileId) {
    return reply.status(401).send({
      success: false,
      message: "User profile not found",
      errorCode: "user-profile-not-found",
      errorKey: 585172,
    });
  }
  // Vérifier que l'utilisateur est bien participant du projet avec le rôle "contributor" ou "teamLeader"
  const participant = await ProjectsService.getParticipantByProjectAndProfile(
    projectId,
    profileId
  );
  if (!participant) {
    return reply.status(403).send({
      success: false,
      message: "User is not a participant of this project",
      errorCode: "user-not-participant",
      errorKey: 295576,
    });
  }



  if (!["contributor", "teamLeader"].includes(participant.role_name)) {
    return reply.status(403).send({
      success: false,
      message: "User is not authorized to sign this project",
      errorCode: "unauthorized-sign",
      errorKey: 612373,
    });
  }

  // Procéder à la signature
  const result = await ProjectsService.signProject(
    projectId,
    participant.id,
    signature
  );
  if (result.success === false) {
    return reply.status(500).send({
      success: false,
      message: "Error while signing project",
      errorKey: 226916,
      errorCode: "signing-error",
      fromError: !Config.IN_PROD ? result : null,
    });
  }

  const checkAllSignatures = await ProjectsService.checkAllSignatures(
    null,
    projectId
  );
  let project;
  if (checkAllSignatures === true) {
    project = await getProject({ params: { projectId } }, reply);



    const projectChain = project.stringified;
const projectUrl = escapeForSolidityJSON(project.url);
const title = escapeForSolidityJSON(project.title);
const projectHash = project.hash; 

const participantAddresses = [project.team_leader.wallet_address.toLowerCase()];
const participantIds = [project.team_leader.id];
const participantUsernames = [escapeForSolidityJSON(project.team_leader.username)];
const participantFullnames = [escapeForSolidityJSON(project.team_leader.first_name + " " + project.team_leader.last_name)];
const participantSignatures = [project.team_leader.signature];

const nftImageUrl = escapeForSolidityJSON(project.nftImg || project.nft_img || "");
const nftRoles = ["teamLeader"];
const nftContributionPercentages = [project.team_leader.contribution + "%"];
const nftContributionDescriptions = [escapeForSolidityJSON(project.team_leader.contribution_description || "no-description")];
const nftFinalizationDate = escapeForSolidityJSON(project.due_date.toString());

project.contributors.forEach((contributor) => {
  participantAddresses.push(contributor.wallet_address);
  participantIds.push(contributor.id);
  participantUsernames.push(escapeForSolidityJSON(contributor.username));
  participantFullnames.push(escapeForSolidityJSON(contributor.first_name + " " + contributor.last_name));
  participantSignatures.push(contributor.signature);
  nftRoles.push("contributor");
  nftContributionPercentages.push(contributor.contribution + "%");
  nftContributionDescriptions.push(escapeForSolidityJSON(contributor.contribution_description || "no-description"));
});

const data = {
  projectId: projectId,
  projectChain,
  projectUrl,
  title,
  projectHash,
  participantAddresses,
  participantIds,
  participantUsernames,
  participantFullnames,
  participantSignatures,
  nftImageUrl,
  nftRoles,
  nftContributionPercentages,
  nftContributionDescriptions,
  nftFinalizationDate,
};

    console.log('=== data === projects.controller.js === key: 404493 ===');
    console.dir(data, { depth: null, colors: true })
    console.log('=================================');
    

    const receipt = await BlockchainService.registerProjectOnChain(data);

    console.log("=== receipt === projects.controller.js === key: 045923 ===");
    console.dir(receipt, { depth: null, colors: true });
    console.log("=================================");

    // Check if blockchain registration failed
    if (receipt?.success === false) {
      const errorMessage = receipt.fromError?.code === 'INSUFFICIENT_FUNDS'
        ? 'Insufficient funds to mint NFTs on blockchain. Please add funds to the wallet.'
        : 'Failed to register project on blockchain.';

      return reply.status(500).send({
        success: false,
        message: errorMessage,
        errorCode: receipt.errorCode || 'blockchain-registration-failed',
        errorKey: 412887,
        fromError: !Config.IN_PROD ? receipt.fromError : null,
      });
    }

    const nfts = await BlockchainService.getNFTsForProject(projectId);
    console.log("=== nfts === projects.controller.js === key: 485608 ===");
    console.dir(nfts, { depth: null, colors: true });
    console.log("=================================");



    if(nfts && nfts.length && nfts[0].length > 0) {
      const usernames = nfts[0]
      const participantIds = nfts[1];
      const nftTokenIds = nfts[2].map((nft) => nft.toString());
      const tokenURIs = nfts[3];

      console.log('=== nftTokenIds === projects.controller.js === key: 277003 ===');
      console.dir(nftTokenIds, { depth: null, colors: true })
      console.log('=================================');

      for (let i = 0; i < nfts[0].length; i++) {
      try {
        const participantId = participantIds[i];
        const tokenId = nftTokenIds[i];
        const tokenURI = tokenURIs[i];
        const updates = {
          nft_address: Config.WEB3.CONTRACTS_ADDRESSES.rhizomeNFT,
          nft_token_id: tokenId,
          nft_token_uri: tokenURI,
        };
        const insert = await ParticipantsService.setNFT(projectId, participantId, updates);
        console.log('=== insert === projects.controller.js === key: 936854 ===');
        console.dir(insert, { depth: null, colors: true })
        console.log('=================================');
      } catch (error) {
        console.log('=== error === projects.controller.js === key: 735335 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
        console.log('=== error === projects.controller.js === key: 213667 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
      }
        
      }
    }
  }

  //const projectId = "104dbcf6-966a-4095-927d-64cd89d22c9f+1";

  reply.send(result);
};

// Supprimer un projet
export const deleteProject = async (req, reply) => {
  const { projectId } = req.params;
  const result = await ProjectsService.deleteProject(projectId);
  if (!result) {
    return reply
      .status(404)
      .send({ message: "Project not found or delete failed" });
  }
  reply.status(204).send();
};

/**
 * GET /projects/profile/:profileId
 * Récupérer tous les projets liés à un profileId, avec leurs participants.
 * Classer la liste finale en 3 groupes selon le rôle de ce profileId :
 *   - TeamLeader en premier
 *   - Observer en deuxième
 *   - Contributor en dernier
 */
export const getProjectsByProfileId = async (req, reply) => {
  const { profileId } = req.params;

  console.log('=== profileId  getProjectsByProfileId === projects.controller.js === key: 365284 ===');
  console.dir(profileId, { depth: null, colors: true })
  console.log('=================================');

  const projectStatuses = req.user?.userId ? [1, 2, 3, 4] : [4];
  try {
    const rawData = await ProjectsService.getProjectsByProfileId(
      profileId,
      projectStatuses
    );

    if (rawData?.success === false) {
      return reply.status(500).send({
        success: false,
        message: "Error while fetching projects by profile ID",
        errorKey: 791341,
        fromError: !Config.IN_PROD ? rawData : null,
      });
    }

    const projectsMap = {};
    const userRolePerProject = {};

    for (const row of rawData) {
      const pId = row.project_id;

      if (row.profile_id === profileId) {
        userRolePerProject[pId] = row.role_name;
      }

      if (!projectsMap[pId]) {
        projectsMap[pId] = {
          id: pId,
          title: row.title,
          description: row.description,
          due_date: row.due_date,
          banner_url: row.banner_url,
          category: row.category,
          client: row.client,
          testimonial: row.testimonial,
          stringified: row.stringified,
          hash: row.hash,
          url: row.url || "",
          nft_img: row.nft_img || "",
          status_id: row.status_id,
          created_at: row.project_created_at,
          team_leader: null,
          contributors: [],
          observers: [],
        };
      }

      const participant = {
        id: row.participant_id,
        profile_id: row.profile_id,
        first_name: row.first_name,
        last_name: row.last_name,
        username: row.username,
        avatar_url: row.avatar_url,
        banner_url: row.banner_url,
        bio: row.bio,
        expertise: row.expertise || "N/A",
        contribution: row.contribution,
        contribution_description: row.contribution_description,
        collectif_name: row.collectif_name,
        type_name: row.type_name,
      };

      switch (row.role_name) {
        case "teamLeader":
          projectsMap[pId].team_leader = participant;
          break;
        case "contributor":
          projectsMap[pId].contributors.push(participant);
          break;
        case "observer":
          projectsMap[pId].observers.push(participant);
          break;
        default:
          break;
      }
    }

    const allProjects = Object.values(projectsMap);
    const filteredProjects = await filterProjectsByUserAccess(allProjects, req);



    const teamLeaderProjects = filteredProjects.filter(
      (proj) => userRolePerProject[proj.id] === "teamLeader"
    );
    const observerProjects = filteredProjects.filter(
      (proj) => userRolePerProject[proj.id] === "observer"
    );
    const contributorProjects = filteredProjects.filter(
      (proj) => userRolePerProject[proj.id] === "contributor"
    );

    const orderedProjects = {
      teamLeaderProjects,
      observerProjects,
      contributorProjects,
    };

    return reply.send(orderedProjects);
  } catch (error) {
    console.log('=== error === projects.controller.js === key: 286524 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error fetching projects by profile ID",
      errorKey: 12345,
      fromError: error.message,
    });
  }
};

/**
 *
 * @param {*} req
 * @param {*} reply
 * @returns
 */
export const getProjectSignatureData = async (req, reply) => {
  const { projectId } = req.params;
  if (!projectId) {
    return reply.status(400).send({
      success: false,
      message: "Missing projectId in request",
      errorKey: 987654,
    });
  }
  const signatureData = await ProjectsService.getProjectSignatureData(
    projectId
  );
  if (signatureData.success === false) {
    return reply.status(404).send(signatureData);
  }
  reply.send(signatureData);
};

// controllers/blockchain.controller.mjs
import * as BlockchainService from "#services/blockchain.service.js";
import Config from "#src/config/config.js";
import { ethers } from "ethers";
import * as ParticipantsService from '#services/participants.service.js';



export const getNFTsForProject = async (req, reply) => {
  const { id } = req.params;
  if (!id) {
    return {
      success: false,
      message: "Missing required field projectId",
      errorCode: "missing-field-projectId",
      errorKey: 190774,
    };
  }
  try {
    const nfts = await BlockchainService.getNFTsForProject(id);
    console.log('=== nfts === blockchain.controller.js === key: 086229 ===');
    console.dir(nfts, { depth: null, colors: true })
    console.log('=================================');
    if (nfts.success === false) {
      return {
        success: false,
        message: "Failed to fetch NFTs from blockchain",
        errorCode: "fetch-nfts-failed",
        errorKey: 663833,
        fromError: Config.IN_PROD ? null : nfts,
      };
    }
    const participants = [];
    const participantsIds = nfts[1].map((participant) => {
      return participant;
    });
    for (let i = 0; i < participantsIds.length; i++) {
      const participantId = participantsIds[i];
      const participant = await ParticipantsService.getParticipantById(id, participantId);
      participant.contractAddress = Config.WEB3.CONTRACTS_ADDRESSES.rhizomeNFT;
      participants.push(participant)
    }
    nfts.push(participants);

    console.log('=== nfts === blockchain.controller.js === key: 538934 ===');
    console.dir(nfts, { depth: null, colors: true })
    console.log('=================================');

    return nfts;
  }
  catch (error) {
    console.log('=== error === blockchain.controller.js === key: 440534 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to fetch NFTs from blockchain",
      errorCode: "fetch-nfts-failed",
      errorKey: 607643,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
}

export const getNFTsForProfile= async (req, reply) => {
  const { id } = req.params;
  if (!id) {
    return {
      success: false,
      message: "Missing required field profileId",
      errorCode: "missing-field-profileId",
      errorKey: 935653,
    };
  }
  try {
    const nfts = await BlockchainService.getNFTsForProfile(id);
    console.log('=== nfts === blockchain.controller.js === key: 034844 ===');
    console.dir(nfts, { depth: null, colors: true })
    console.log('=================================');
    if (nfts.success === false) {
      return {
        success: false,
        message: "Failed to fetch NFTs from blockchain",
        errorCode: "fetch-nfts-failed",
        errorKey: 756642,
        fromError: Config.IN_PROD ? null : nfts,
      };
    }
    /** ------------------ cmt 645263 ------------------
    const participants = [];
    const participantsIds = nfts[1].map((participant) => {
      return participant;
    });
    for (let i = 0; i < participantsIds.length; i++) {
      const participantId = participantsIds[i];
      const participant = await ParticipantsService.getParticipantById(id, participantId);
      participant.contractAddress = Config.WEB3.CONTRACTS_ADDRESSES.rhizomeNFT;
      participants.push(participant)
    }
    nfts.push(participants);
    *-------------------------------------------------*/



    const filteredNfts = nfts.filter((nft) => {
      return nft.contract;
    });

    console.log('=== filteredNfts === blockchain.controller.js === key: 348969 ===');
    console.dir(filteredNfts, { depth: null, colors: true })
    console.log('=================================');

    return filteredNfts;
  }
  catch (error) {
    console.log('=== error === blockchain.controller.js === key: 133568 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to fetch NFTs from blockchain",
      errorCode: "fetch-nfts-failed",
      errorKey: 580593,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
}

export const getNFT = async (req, reply) => {
  const { nft_contract, token_id } = req.params;
  if (!nft_contract) {
    return {
      success: false,
      message: "Missing required field NFT Contract",
      errorCode: "missing-field-nft-contract",
      errorKey: 350137,
    };
  }
  if (!token_id) {
    return {
      success: false,
      message: "Missing required field Token ID",
      errorCode: "missing-field-token-id",
      errorKey: 737274,
    };
  }
  try {
    const nft = await BlockchainService.getNFT(nft_contract, token_id);

    if (nft.success === false) {
      return {
        success: false,
        message: "Failed to fetch NFT from blockchain",
        errorCode: "fetch-nft-failed",
        errorKey: 784506,
        fromError: Config.IN_PROD ? null : nft,
      };
    }
   return nft;
  }
  catch (error) {
    console.log('=== error === blockchain.controller.js === key: 440534 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to fetch NFTs from blockchain",
      errorCode: "fetch-nfts-failed",
      errorKey: 607643,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
}

/**
 * Route pour enregistrer un projet on-chain.
 * On suppose que le projet est récupéré depuis la DB et passé dans le corps de la requête.
 */
export const sendProjectToBlockchain = async (request, reply) => {

  const {projectId} = request.body;

  console.log('=== projectId === blockchain.controller.js === key: 943168 ===');
  console.dir(projectId, { depth: null, colors: true })
  console.log('=================================');

  return;


  try {
    // Exemple : on récupère les données du projet depuis le body
    const { projectId, projectUrl, projectText, projectHash, participants, signatures } =
      request.body;

      console.log('=== request.body === blockchain.controller.js === key: 322612 ===');
      console.dir(request.body, { depth: null, colors: true })
      console.log('=================================');

    if (
      !projectId ||
      !projectUrl ||
      !projectText ||
      !projectHash ||
      !participants ||
      !signatures
    ) {
      const missingFields = [];
      if (!projectId) missingFields.push("projectId"); 
      if (!projectUrl) missingFields.push("projectUrl");
      if (!projectText) missingFields.push("projectText");
      if (!projectHash) missingFields.push("projectHash");
      if (!participants) missingFields.push("participants");
      if (!signatures) missingFields.push("signatures");
      return {
        success: false,
        message: "Missing required fields",
        errorCode: "missing-fields",
        missingFields: `[${missingFields.join("|")}]`,
        errorKey: 628893,
      };
    }

    // Appel du service pour enregistrer le projet
    const receipt = await BlockchainService.registerProjectOnChain(
      projectId,
      projectUrl,
      projectText,
      projectHash,
      participants,
      signatures
    );

    return receipt;
  } catch (error) {
    return {
      success: false,
      message: "Failed to register project on-chain",
      errorCode: "register-project-failed",
      errorKey: 651777,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
};

const parseProject = (projectData) => {
  const participants = projectData[3].map((participant) => {
    return {
      address: participant[0],
      signature: participant[1],
    };
  });

  return {
    projectId: projectData[0],
    projectUrl: projectData[1],
    projectHash: projectData[2],
    participants: participants,
  };
};

/**
 * Route pour récupérer un projet on-chain par son ID.
 */
export const getProject = async (request, reply) => {
  try {
    const { id } = request.params;

    if (!id) {
      return {
        success: false,
        message: "Missing required field id",
        errorCode: "missing-field-id",
        errorKey: 839319,
      };
    }
    const projectData = await BlockchainService.getProject(id);

    if (projectData.success === false) {
      return {
        success: false,
        message: "Failed to fetch project from blockchain",
        errorCode: "fetch-project-failed",
        errorKey: 553669,
        fromError: Config.IN_PROD ? null : projectData,
      };
    }

    return parseProject(projectData);
  } catch (error) {
    console.log('=== error === blockchain.controller.js === key: 927665 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to fetch project from blockchain",
      errorCode: "fetch-project-failed",
      errorKey: 113953,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
};

export const getSignatureByAddress = async (request, reply) => {
  try {
    const { projectId, participant } = request.params;
    const signature = await BlockchainService.getSignatureByAddress(
      projectId,
      participant
    );
    if (signature.success === false) {
      return {
        success: false,
        message: "Failed to fetch signature from blockchain",
        errorCode: "fetch-signature-failed",
        errorKey: 338008,
        fromError: Config.IN_PROD ? null : signature,
      };
    }
    return signature;
  } catch (error) {
    console.log('=== error === blockchain.controller.js === key: 237119 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to fetch signature from blockchain",
      errorCode: "fetch-signature-failed",
      errorKey: 444344,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
};

export const getAllProjects = async (request, reply) => {
  try {
    const projectsArray = await BlockchainService.getAllProjects();
    if (projectsArray.success === false) {
      return {
        success: false,
        message: "Failed to fetch projects from blockchain",
        errorCode: "fetch-projects-failed",
        errorKey: 520294,
        fromError: Config.IN_PROD ? null : projectsArray,
      };
    }
    return projectsArray.map((projectData) => parseProject(projectData));
  } catch (error) {
    console.log('=== error === blockchain.controller.js === key: 623824 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to fetch projects from blockchain",
      errorCode: "fetch-projects-failed",
      errorKey: 985692,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
};

export const setUseWhitelist = async (request, reply) => {
  try {
    const { useWhitelist } = request.body;
    const receipt = await BlockchainService.setUseWhitelist(useWhitelist);
    if (receipt.success === false) {
      return {
        success: false,
        message: "Failed to set useWhitelist on blockchain",
        errorCode: "set-useWhitelist-failed",
        errorKey: 283721,
        fromError: Config.IN_PROD ? null : receipt,
      };
    }
    return {
        success: true,
        message: "useWhitelist set successfully",
    };
  } catch (error) {
    console.log('=== error === blockchain.controller.js === key: 250117 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "Failed to set useWhitelist on blockchain",
      errorCode: "set-useWhitelist-failed",
      errorKey: 829619,
      fromError: Config.IN_PROD ? null : error.message,
    };
  }
};

const test = async () => {

    let project = await getProject({params: {id: "project_4"}});

    console.log('=== project === blockchain.controller.js === key: 674327 ===');
    console.dir(project, { depth: null, colors: true })
    console.log('=================================');

    
    const projectId = "project_4";
    const projectUrl = "https://myproject.com";
    const projectText = '{"id":"10000000-0000-0000-0000-000000000001","description":"Projet de test Alpha","participants":[{"id":"3035a70d-3b2c-4e50-9ceb-7df6877b65e5","profile_id":"fe711d6e-3642-427b-b04c-374b3cea0da3","contribution":10,"contribution_description":"Contribution Description - 631083"},{"id":"260e1df0-948b-4b6c-a138-d2b3c3a9471d","profile_id":"73004897-0823-4a0b-af47-92d722442afe","contribution":10,"contribution_description":"Contribution technique de Charlie"},{"id":"a42c9288-f3cf-4bfd-a2a3-c6a8db047db1","profile_id":"298bee9e-f94d-4737-9c31-39cc8434b3c3","contribution":10,"contribution_description":"Contrib nouveau participant"},{"id":"5b6e3011-7188-48be-9b81-cc6a46fc0ad7","profile_id":"0c67cb50-1112-4f8e-85c4-63cee7b21786","contribution":15,"contribution_description":"Contribution technique tutu titi"},{"id":"1a85cb87-6bab-46ab-9810-bea6b866b914","profile_id":"401d34c8-468a-439f-83eb-a98d287f685d","contribution":10,"contribution_description":"Contrib de Franck"}]}';
    const projectHash = "0xddbccf1bd9e14705bed9ebac4dabd3e2611939d71d0089c364d45c88423819ec";
    const participants = ["0x90c8dA48d76fcB6Dfff369bf69Be08Ae2c027162"];
    const signatures = ["0xd08b5055d1bba38648188de4c8de8062313e82b410405e92a49ff6f6cc5bef6b5ec16a217c443215845534ae073cb44ec6c6397d6ef7acf957a1637e09cc0c271b"].map((signature) => {
        return ethers.getBytes(signature);
    });
    const receipt = await sendProjectToBlockchain({body: {projectId, projectUrl, projectText, projectHash, participants, signatures}});

    console.log('=== receipt === blockchain.service.js === key: 275155 ===');
    console.dir(receipt, { depth: null, colors: true })
    console.log('=================================');

    /** ------------------ cmt 352221 ------------------
    

    let projects = await getAllProjects();
    console.log('=== projects === blockchain.service.js === key: 417922 ===');
    console.dir(projects, { depth: null, colors: true })
    console.log('=================================');

    projects = await getSignatureByAddress("project_4","0x1234567890123456789012345678901234567893");
    console.log('=== projects === blockchain.service.js === key: 014768 ===');
    console.dir(projects, { depth: null, colors: true })
    console.log('=================================');  

    projects = await getProject("project_4");
    console.log('=== projects === blockchain.service.js === key: 968558 ===');
    console.dir(projects, { depth: null, colors: true })
    console.log('=================================');  
    *-------------------------------------------------*/



    /** ------------------ cmt 913055 ------------------
    

    const receipt = await addToWhitelist('0x1234567890123456789012345678901234567892');
    console.log('=== receipt === blockchain.service.js === key: 243715 ===');
    console.dir(receipt, { depth: null, colors: true })
    console.log('=================================');

    const allWhitelistedAddresses = await getAllWhitelistedAddresses();
    console.log('=== allWhitelistedAddresses === blockchain.service.js === key: 567078 ===');
    console.dir(allWhitelistedAddresses, { depth: null, colors: true })
    console.log('=================================');
    
    
    *-------------------------------------------------*/
}

//test();

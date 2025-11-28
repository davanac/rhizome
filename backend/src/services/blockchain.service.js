// services/blockchain.service.mjs
import { ethers } from "ethers";
import fs from "fs";
import Config, {KeyUtils} from '#config';

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rhizomeNftABI = JSON.parse(readFileSync(join(__dirname, "../web3/artifacts/src/web3/contracts/RhizomeNFT.sol/RhizomeNFT.json"), "utf8"));
const projectRegistryABI = JSON.parse(readFileSync(join(__dirname, "../web3/artifacts/src/web3/contracts/ProjectsRegistry.sol/ProjectsRegistry.json"), "utf8"));
import pool from "#database/database.js";


let secretKey;

try {
  secretKey = KeyUtils.getKey(process.env.MASTER_KEY_PASSWORD, process.env.MASTER_KEY_ID);
} catch (error) {
  console.log("=== error === hardhat.config.js === key: 064096 ===");
  console.dir(error, { depth: null, colors: true });
  console.log("=================================");
}




const blockchainEnv = Config.WEB3[Config.WEB3.BLOCKCHAIN_ENV];

const networkName = Config.WEB3.BLOCKCHAIN_ENV.toLowerCase();

const deployedFile = `src/web3/deployed/deployed-contracts-${networkName}.json`;

const deployedContracts = JSON.parse(fs.readFileSync(deployedFile, "utf8"));
const NFT_ADDRESS = deployedContracts.rhizomeNFT;
const REGISTRY_ADDRESS = deployedContracts.projectsRegistry;

console.log('=== blockchainEnv === blockchain.service.js === key: 519012 ===');
console.dir(blockchainEnv, { depth: null, colors: true })
console.log('=================================');


// Utilise le RPC de Sepolia (ou un autre réseau, selon tes besoins)
let provider;
try {
  provider = new ethers.JsonRpcProvider(blockchainEnv.RPC_URL);
} catch (error) {
  console.log('=== error === blockchain.service.js === key: 009696 ===');
  console.dir(error, { depth: null, colors: true })
  console.log('=================================');

}

// Crée un wallet à partir de la clé privée
const wallet = new ethers.Wallet(secretKey, provider);

// Récupère les adresses de tes contrats depuis les variables d'environnement
const rhizomeNftAddress = NFT_ADDRESS
const projectRegistryAddress = REGISTRY_ADDRESS;

// Crée les instances de contrat
const rhizomeNftContract = new ethers.Contract(rhizomeNftAddress, rhizomeNftABI.abi, wallet);
const projectRegistryContract = new ethers.Contract(projectRegistryAddress, projectRegistryABI.abi, wallet);

const getNFTContractFromAddress = async (address) => {
  const contract = new ethers.Contract(address, rhizomeNftABI.abi, wallet);
  return contract;
}

/** ------------------ cmt 056067 ------------------
const allProjects = await projectRegistryContract.getAllProjects();
  console.log('=== allProjects === testMintFinal.js === key: 739435 ===');
  console.dir(allProjects, { depth: null, colors: true })
  console.log('=================================');
*-------------------------------------------------*/

export const getNFT = async (contractAddress,tokenId) => {
  try {
    const contract = await getNFTContractFromAddress(contractAddress);
    const metadataURI = await contract.tokenURI(tokenId);
    const owner = await contract.ownerOf(tokenId);
    const base64Data = metadataURI.split("base64,")[1];
    const decodedMetadata = Buffer.from(base64Data, "base64").toString("utf8");
    return {owner,metadataURI,decodedMetadata};
  } catch (error) {
    console.log('=== error === blockchain.service.js === key: 197284 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
        success: false,
        message:"getNFT failed",
        errorKey:938277,
        errorCode:"get-nft-failed",
        fromError:!Config.IN_PROD?error:null,
    }
  }
}

/**
 * Enregistre un projet on-chain.
 * @param {string} projectUrl - L'URL du projet.
 * @param {string} projectHash - Le hash du projet.
 * @param {Array<string>} participants - Liste des adresses des participants.
 * @param {Array<string>} signatures - Liste des signatures off-chain.
 * @returns {Promise<Object>} - Le receipt de la transaction.
 */
export const registerProjectOnChain = async (
  data
) => {
  try {
    /** ------------------ cmt 794528 ------------------
    const tx = await projectRegistryContract.registerProject(projectId, projectUrl,projectText, projectHash, participants, signatures);
    const receipt = await tx.wait();
    return receipt;
    *-------------------------------------------------*/
   const {projectId,
    projectChain,
    projectUrl,
    title,
    projectHash,
    participantIds,
    participantAddresses,
    participantFullnames,
    participantUsernames,
    participantSignatures,
    nftImageUrl,
    nftRoles,
    nftContributionPercentages,
    nftContributionDescriptions,
    nftFinalizationDate} = data;

    console.log('=== data === blockchain.service.js === key: 047463 ===');
    console.dir(data, { depth: null, colors: true })
    console.log('=================================');

    const participantCount = participantAddresses?.length || 0;
    console.log(`=== [BLOCKCHAIN] Starting registerProject === key: 047464 ===`);
    console.log(`    Project ID: ${projectId}`);
    console.log(`    Title: ${title}`);
    console.log(`    Participant count: ${participantCount}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    const startTime = Date.now();

    const txRegister = await projectRegistryContract.registerProject(
      projectId,
      projectChain,
      projectUrl,
      title,
      projectHash,
      participantAddresses,
      participantIds,
      participantFullnames,
      participantUsernames,
      participantSignatures,
      nftImageUrl,
      nftRoles,
      nftContributionPercentages,
      nftContributionDescriptions,
      nftFinalizationDate
    );

    const txSubmitTime = Date.now();
    console.log(`=== [BLOCKCHAIN] Transaction submitted === key: 047465 ===`);
    console.log(`    TX Hash: ${txRegister.hash}`);
    console.log(`    Time to submit: ${txSubmitTime - startTime}ms`);
    console.log('=================================');

    const receipt = await txRegister.wait();

    const endTime = Date.now();
    console.log(`=== [BLOCKCHAIN] Project registered on chain === key: 047466 ===`);
    console.log(`    Project ID: ${projectId}`);
    console.log(`    Participant count: ${participantCount}`);
    console.log(`    Block number: ${receipt.blockNumber}`);
    console.log(`    Gas used: ${receipt.gasUsed?.toString()}`);
    console.log(`    Time to confirm: ${endTime - txSubmitTime}ms`);
    console.log(`    Total time: ${endTime - startTime}ms`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return receipt;
  } catch (error) {
    console.log('=== error === blockchain.service.js === key: 894619 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
        success: false,
        message:"registerProjectOnChain failed", 
        errorKey:885641,
        errorCode:"register-project-on-chain-failed",
        fromError:!Config.IN_PROD?error:null,
    }
  }
};

export const getNFTsForProject = async (projectId) => {
  try {
    const startTime = Date.now();
    console.log(`=== [NFT] Fetching NFTs for project === key: 238860 ===`);
    console.log(`    Project ID: ${projectId}`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    const nfts = await projectRegistryContract.getNFTsForProject(projectId);

    const fetchNftsTime = Date.now();
    const nftCount = nfts[2]?.length || 0;
    console.log(`=== [NFT] Retrieved ${nftCount} NFTs from contract === key: 238861 ===`);
    console.log(`    Time to fetch: ${fetchNftsTime - startTime}ms`);
    console.log('=================================');

    const nftsArray = [];
    const metadataURIs = [];
    for(var i=0; i<nfts[2].length; i++){
      const tokenId = nfts[2][i];
      const nftStartTime = Date.now();

      console.log(`=== [NFT] Fetching tokenURI ${i + 1}/${nftCount} === key: 238862 ===`);
      console.log(`    Token ID: ${tokenId.toString()}`);
      console.log(`    Username: ${nfts[0][i]}`);

      const metadataURI = await rhizomeNftContract.tokenURI(tokenId);
      const base64Data = metadataURI.split("base64,")[1];
      const decodedMetadata = Buffer.from(base64Data, "base64").toString("utf8");
      metadataURIs.push(decodedMetadata);

      const nftEndTime = Date.now();
      console.log(`    Time to fetch tokenURI: ${nftEndTime - nftStartTime}ms`);
      console.log('=================================');
    }
    nftsArray.push(nfts[0]);
    nftsArray.push(nfts[1]);
    nftsArray.push(nfts[2].map((tokenId) => tokenId.toString()));
    nftsArray.push(metadataURIs);

    const totalTime = Date.now();
    console.log(`=== [NFT] All NFTs fetched successfully === key: 238863 ===`);
    console.log(`    Project ID: ${projectId}`);
    console.log(`    NFT count: ${nftCount}`);
    console.log(`    Total time: ${totalTime - startTime}ms`);
    console.log(`    Timestamp: ${new Date().toISOString()}`);
    console.log('=================================');

    return nftsArray;
  } catch (error) {
    console.log('=== error === blockchain.service.js === key: 238865 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
        success: false,
        message:"getNFTsForProject failed",
        errorKey:661795,
        errorCode:"get-nfts-for-project-failed",
        fromError:error
    }
  }
}

export const getNFTsForProfile = async (profileId) => {
  try {
    const query = `
    SELECT pp.nft_address AS contract, nft_token_id AS tokenId, nft_token_uri AS tokenURI
    FROM project_participants pp
    WHERE pp.profile_id = $1
  `;
  try {
    const result = await pool.query(query, [ profileId]);
    if (result.rowCount === 0) {
      return [];
    }
    return result.rows;
  } catch (error) {
    console.log('=== error === blockchain.service.js === key: 297508 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
      success: false,
      message: "getNFTsForProfile failed",
      errorKey: 648755,
      errorCode: "get-nfts-for-profile-failed",
      fromError: error,
    }
  }
  } catch (error) {
    console.log('=== error === blockchain.service.js === key: 648755 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
        success: false,
        message:"getNFTsForProfile failed",
        errorKey:464026,
        errorCode:"get-nfts-for-profile-failed",
        fromError:error
    }
  }
}

/**
 * Récupère les données d'un projet on-chain.
 * @param {number} projectId - L'identifiant du projet.
 * @returns {Promise<Object>} - Les données du projet.
 */
export const getProject = async (projectId) => {
  try {
    const projectData = await projectRegistryContract.getProject(projectId);
    return projectData;
  } catch (error) {
    console.log('=== error === blockchain.service.js === key: 792964 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
    return {
        success: false,
        message:"getProjectOnChain failed",
        errorKey:293656,
        errorCode:"get-project-on-chain-failed",
        fromError:error
    }
  }
};

/**
 * Récupére la signature d'un participant pour un projet donné.
 * @param {number|string} projectId - L'ID du projet.
 * @param {string} participant - L'adresse du participant.
 */
export const getSignatureByAddress = async (projectId, participant) => {
    try {
      const signature = await projectRegistryContract.getSignatureByAddress(projectId, participant);
      return signature;
    } catch (error) {
      console.log('=== error === blockchain.service.js === key: 718701 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
      return {
          success: false,
          message:"getSignatureByAddress failed",
          errorKey:252625,
          errorCode:"get-signature-by-address-failed",
          fromError:error
      }
    }
  };

  export const getAllProjects = async () => {
    try {
      const projectsArray = await projectRegistryContract.getAllProjects();
      return projectsArray;
    } catch (error) {
      console.log('=== error === blockchain.service.js === key: 284552 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
      return {
          success: false,
          message:"getAllProjects failed",
          errorKey:964241,
          errorCode:"get-all-projects-failed",
          fromError:error
      }
    }
  };

  /**
   * Exemple de fonction pour gérer la whitelist.
   * @param {string} addressToAdd - Adresse à ajouter.
   * @returns {Promise<Object>} - Le receipt de la transaction.
   */
  export const addToWhitelist = async (addressToAdd) => {
    try {
      const tx = await projectRegistryContract.addToWhitelist(addressToAdd);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
        console.log('=== error === blockchain.service.js === key: 732598 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
      return {
            success: false,
            message:"addToWhitelist failed",
            errorKey:787094,
            errorCode:"add-to-whitelist-failed",
            fromError:error
            
      }
    }
  };

  /**
   * Exemple de fonction pour gérer la whitelist.
   * @param {string} addressToRemove - Adresse à retirer.
   * @returns {Promise<Object>} - Le receipt de la transaction.
   */
  export const removeFromWhitelist = async (addressToRemove) => {
    try {
      const tx = await projectRegistryContract.removeFromWhitelist(addressToRemove);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.log('=== error === blockchain.service.js === key: 278554 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
        return {
            success: false,
            message:"removeFromWhitelist failed",
            errorKey:479935,
            errorCode:"remove-from-whitelist-failed",
            fromError:error
        }
    }
  };

  /**
   * Exemple de fonction pour gérer la whitelist.
   * @param {string} addressToRemove - Adresse à retirer.
   * @returns {Promise<Object>} - Le receipt de la transaction.
   */
  export const getAllWhitelistedAddresses = async () => {
    try {
      const allWhitelistedAddresses = await projectRegistryContract.getAllWhitelistedAddresses();
      return allWhitelistedAddresses;
    } catch (error) {
      console.log('=== error === blockchain.service.js === key: 460151 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
        return {
            success: false,
                    message:"getAllWhitelistedAddresses failed",
                    errorKey:479935,
                    errorCode:"get-all-whitelisted-addresses-failed",
                    fromError:error
        }
        
    }
  };

  export const setUseWhitelist = async (useWhitelist) => {
    try {
      const tx = await projectRegistryContract.setUseWhitelist(useWhitelist);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.log('=== error === blockchain.service.js === key: 707309 ===');
      console.dir(error, { depth: null, colors: true })
      console.log('=================================');
      return {
          success: false,
          message:"setUseWhitelist failed",
          errorKey:140113,
          errorCode:"set-use-whitelist-failed",
          fromError:error
      }
    }
  };

// Tu peux ajouter d'autres fonctions (removeFromWhitelist, setUseWhitelist, etc.) de manière similaire.

const test = async () => {

  const projectId = "104dbcf6-966a-4095-927d-64cd89d22c9f+1";
    const projectChain = `{"id":"104dbcf6-966a-4095-927d-64cd89d22c9f","description":"La description du nouveau projet","participants":[{"id":"3cbf3386-c46b-4d02-a64f-4210a9d6ed2f","profile_id":"975ad427-824a-4ce2-a7ff-1cbd30943f46","contribution":20,"contribution_description":"L'équipe du Collectif Alice participe au projet"},{"id":"4fbcd2c9-cb50-4d82-b98c-d3d6ae930c50","profile_id":"78b035ee-7dca-48ea-86de-5a61d3ee3cde","contribution":40,"contribution_description":"Bob participe aussi"},{"id":"98a80a02-a2d7-4fe1-8331-4c2a29c9ca04","profile_id":"bd3710a3-164c-497e-9802-17197b2cb5ff","contribution":40,"contribution_description":"La description de la participation d'alice"}]}`;
    const projectUrl ="http://localhost:8080/project/104dbcf6-966a-4095-927d-64cd89d22c9f-nouveau-projet";
    const title = "Nouveau projet";
    const projectHash ="0x89e088374400ac94a5ddb12f2203e7f7125361fc5001b1e27e64c78d448ac3b0";
    //const projectHash =ethers.sha256(ethers.toUtf8Bytes(projectChain));
    const participantAddresses = ["0xcF8a7e484FA94AE0DeE484714B958Aa17878cB90"]
    const participantUsernames = ["alice-perso-1"];
    const participantSignatures = ["0x1152139d5844cc4980315d3ec18dcafabec28e747a75ac4463fd7c7b41bb0e117fc33771948808dd0bd8490a92f8f27a97b2e2b52344e2e1f413f3ae7e2d12441c"];
    const nftImageUrl="http://localhost:3009/api/v1/images/00adc077-b1ed-469b-9420-db5af0e7544e-cropped-image.jpg";
    const nftRoles =["teamLeader"];
    const nftContributionPercentages = ["50%"];
    const nftFinalizationDate = "2023-10-01T00:00:00Z";

    const data = {
      projectId,
      projectChain,
      projectUrl,
      title,
      projectHash,
      participantAddresses,
      participantUsernames,
      participantSignatures,
      nftImageUrl,
      nftRoles,
      nftContributionPercentages,
      nftFinalizationDate
    };

    const receipt = await registerProjectOnChain(data);

    console.log('=== receipt === blockchain.service.js === key: 256835 ===');
    console.dir(receipt, { depth: null, colors: true })
    console.log('=================================');

  /** ------------------ cmt 962472 ------------------
    const projectId = "project_1";
    const projectUrl = "https://myproject.com";
    const projectText = '{"id":"10000000-0000-0000-0000-000000000001","description":"Projet de test Alpha","participants":[{"id":"3035a70d-3b2c-4e50-9ceb-7df6877b65e5","profile_id":"fe711d6e-3642-427b-b04c-374b3cea0da3","contribution":10,"contribution_description":"Contribution Description - 631083"},{"id":"260e1df0-948b-4b6c-a138-d2b3c3a9471d","profile_id":"73004897-0823-4a0b-af47-92d722442afe","contribution":10,"contribution_description":"Contribution technique de Charlie"},{"id":"a42c9288-f3cf-4bfd-a2a3-c6a8db047db1","profile_id":"298bee9e-f94d-4737-9c31-39cc8434b3c3","contribution":10,"contribution_description":"Contrib nouveau participant"},{"id":"5b6e3011-7188-48be-9b81-cc6a46fc0ad7","profile_id":"0c67cb50-1112-4f8e-85c4-63cee7b21786","contribution":15,"contribution_description":"Contribution technique tutu titi"},{"id":"1a85cb87-6bab-46ab-9810-bea6b866b914","profile_id":"401d34c8-468a-439f-83eb-a98d287f685d","contribution":10,"contribution_description":"Contrib de Franck"}]}';
    const projectHash = ethers.keccak256(ethers.toUtf8Bytes(projectText));
    //const projectHash = "0xd7ebbf8b27e8a5078da1c05b1256f66c4e6c77fa9055a06d67b773138ffdaf9c";
    const participants = ["0x90c8dA48d76fcB6Dfff369bf69Be08Ae2c027162"];
    const signatures = ["0xd08b5055d1bba38648188de4c8de8062313e82b410405e92a49ff6f6cc5bef6b5ec16a217c443215845534ae073cb44ec6c6397d6ef7acf957a1637e09cc0c271b"];
    const receipt = await registerProjectOnChain(projectId, projectUrl, projectText, projectHash, participants, signatures);

    console.log('=== receipt === blockchain.service.js === key: 275155 ===');
    console.dir(receipt, { depth: null, colors: true })
    console.log('=================================');

   
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

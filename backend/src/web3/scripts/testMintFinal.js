import pkg from "hardhat";
const { ethers, network } = pkg;
import { ethers as ethersjs } from "ethers";
import fs from "fs";
import {KeyUtils} from "#config";
//import KeyUtils from "/Users/ludiq/.wallets/keyutils.js";

let secretKey;

try {
  secretKey = KeyUtils.getKey(process.env.MASTER_KEY_PASSWORD, process.env.MASTER_KEY_ID);
} catch (error) {
  console.log("=== error === hardhat.config.js === key: 064096 ===");
  console.dir(error, { depth: null, colors: true });
  console.log("=================================");
}

// Lecture des adresses depuis le fichier deployed-contracts.json
const networkName = network.name === "hardhat" ? "localhost" : network.name;
const deployedFile = `src/web3/deployed/deployed-contracts-${networkName}.json`;

const deployedContracts = JSON.parse(fs.readFileSync(deployedFile, "utf8"));
const NFT_ADDRESS = deployedContracts.rhizomeNFT;
const REGISTRY_ADDRESS = deployedContracts.projectsRegistry;

const main = async () => {
  // Récupération des signers. Sur Sepolia, si vous n'avez qu'une seule PRIVATE_KEY,
  // ethers.getSigners() renverra un tableau d'une seule adresse.
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Last block number:", blockNumber);
  } catch (error) {
    
    console.log('=== error === testMintFinal.js === key: 733263 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
  }

  const participants = [];
  const nbrParticipants = 12;
  const signers = await ethers.getSigners();

  let deployer, participant1, participant2;
  if (signers.length >= 3) {
    deployer = signers[0];
    for (let i = 0; i < nbrParticipants; i++) {
      participants.push(signers[i + 1]);
      console.log(`Participant ${i + 1} :`, signers[i + 1].address);
    }
  } else {
    deployer = new ethers.Wallet(secretKey, ethers.provider);

    //deployer = signers[0];

    //creation de participants aléatoires
    for (let i = 0; i < nbrParticipants; i++) {
      const randomWallet = ethers.Wallet.createRandom().connect(
        ethers.provider
      );
      participants.push(randomWallet);
      console.log(`Participant ${i + 1} :`, randomWallet.address);
    }
    // Utilisation de portefeuilles aléatoires pour participant1 et participant2

    /** ------------------ cmt 393056 ------------------
    participant1 = ethers.Wallet.createRandom().connect(ethers.provider);
    participant2 = ethers.Wallet.createRandom().connect(ethers.provider);
    console.log("Utilisation de portefeuilles aléatoires pour participant1 et participant2.");
    console.log("Participant1 :", participant1.address);
    console.log("Participant2 :", participant2.address);
   *-------------------------------------------------*/
  }

  // Attachement aux instances déjà déployées
  const RhizomeNFTFactory = await ethers.getContractFactory("RhizomeNFT");
  const rhizomeNFT = RhizomeNFTFactory.attach(NFT_ADDRESS).connect(deployer);

  console.log(
    "=== ethers.provider.getCode === testMintFinal.js === key: 223681 ==="
  );
  console.dir(network.name, { depth: null, colors: true });
  console.log("=================================");

  const ProjectsRegistryFactory = await ethers.getContractFactory(
    "ProjectsRegistry"
  );
  const projectsRegistry =
    ProjectsRegistryFactory.attach(REGISTRY_ADDRESS).connect(deployer);

  console.log("=== Informations sur les contrats déjà déployés ===");
  console.log("RhizomeNFT :", NFT_ADDRESS);
  console.log("ProjectsRegistry :", REGISTRY_ADDRESS);
  console.log("==================================================");

  // 1. Vérifier que le Registry est bien owner du contrat NFT
  let currentNftOwner = await rhizomeNFT.owner();
  console.log("Owner actuel du NFT :", currentNftOwner);
  if (currentNftOwner.toLowerCase() !== REGISTRY_ADDRESS.toLowerCase()) {
    console.log("Transfert de propriété du NFT vers le Registry...");
    const txOwnership = await rhizomeNFT.transferOwnership(REGISTRY_ADDRESS);
    await txOwnership.wait();
    currentNftOwner = await rhizomeNFT.owner();
    console.log("Après transfert, NFT owner :", currentNftOwner);
  } else {
    console.log("Le NFT est déjà possédé par le Registry.");
  }

  // 2. Vérifier que dans le Registry, l'adresse du NFT est bien définie
  let registryNFTAddr = await projectsRegistry.nftContractAddress();
  console.log("NFT Contract address dans Registry :", registryNFTAddr);
  if (registryNFTAddr.toLowerCase() !== NFT_ADDRESS.toLowerCase()) {
    console.log("Mise à jour de l'adresse NFT dans le Registry...");
    const txSetNft = await projectsRegistry.setNFTContractAddress(NFT_ADDRESS);
    await txSetNft.wait();
    registryNFTAddr = await projectsRegistry.nftContractAddress();
    console.log(
      "Après mise à jour, NFT address in Registry :",
      registryNFTAddr
    );
  } else {
    console.log(
      "L'adresse NFT est déjà correctement configurée dans le Registry."
    );
  }

  // 3. Préparer les données pour l'enregistrement d'un projet
  // Génération d'un identifiant unique pour le projet
  const rnd =
    Math.floor(Math.random() * 1000) +
    "-" +
    Math.floor(Math.random() * 1000) +
    "-" +
    Math.floor(Math.random() * 1000);
  const projectId = "myProject_" + rnd;
  const projectChain = "Description brute de mon projet Rhizome " + rnd;
  const projectUrl = "https://rhizome.io/projects/myProject/" + rnd;
  const title = "Projet Rhizome Demo " + rnd;

  // Calcul du hash (SHA-256) de projectChain en utilisant getBytes
  const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));

  // Préparer les données pour le participant (ici participant1)
  /** ------------------ cmt 680064 ------------------
  const participantAddresses = [participant1.address];
  const participantUsernames = ["Alice"];
  *-------------------------------------------------*/
  const participantAddresses = participants.map(
    (participant) => participant.address
  );
  const participantUsernames = participants.map(
    (_, index) => `Participant ${index + 1}`
  );

  const participantIds = participants.map(
    (_, index) => `participant_id_${index + 1}`
  );
  // Utiliser getBytes en ethers v6
  /** ------------------ cmt 280449 ------------------
  const sig1 = await participant1.signMessage(ethersjs.getBytes(projectHash));
  const participantSignatures = [sig1];
  *-------------------------------------------------*/
  const participantSignatures = await Promise.all(
    participants.map((participant) =>
      participant.signMessage(ethersjs.getBytes(projectHash))
    )
  );

  // Paramètres pour le mint du NFT
  const nftImageUrl = "https://rhizome.io/images/myProject.png";
  const nftRole = "Collaborateur";
  const nftContributionPercentage = "75%";
  const nftFinalizationDate = "2025-04-09";

  const nftRoles = [];
  const nftContributionPercentages = [];
  for (let i = 0; i < participantAddresses.length; i++) {
    nftRoles.push(nftRole + ` ${i + 1}`);
    nftContributionPercentages.push(nftContributionPercentage);
  }

  console.log("Enregistrement du projet et mint des NFT via le Registry...");
  console.log("=== {name} === testMintFinal.js === key: 253526 ===");
  console.dir(
    {
      projectId,
      projectChain,
      projectUrl,
      title,
      projectHash,
      participantAddresses,
      participantIds,
      participantUsernames,
      participantSignatures,
      nftImageUrl,
      nftRoles,
      nftContributionPercentages,
      nftFinalizationDate,
    },
    { depth: null, colors: true }
  );
  console.log("=================================");
  const txRegister = await projectsRegistry.registerProject(
    projectId,
    projectChain,
    projectUrl,
    title,
    projectHash,
    participantAddresses,
    participantIds,
    participantUsernames,
    participantSignatures,
    nftImageUrl,
    nftRoles,
    nftContributionPercentages,
    nftFinalizationDate
  );
  await txRegister.wait();
  console.log("Projet enregistré et NFT minté pour les participants !");
  console.log("==================================================");

  // 4. Vérifier les informations du projet depuis le Registry
  const projectData = await projectsRegistry.getProject(projectId);
  console.log("== Détails du Projet ==");
  console.log("Titre :", projectData.title);
  console.log("URL   :", projectData.url);
  console.log("Hash  :", projectData.projectHash);
  console.log(
    "Nombre de participants :",
    projectData.participantsCount.toString()
  );

  console.log("=== projectData === testMintFinal.js === key: 835113 ===");
  console.dir(projectData, { depth: null, colors: true });
  console.log("=================================");

  // 5. Récupérer les informations du premier participant et son tokenId
  const participantData = await projectsRegistry.getParticipant(
    projectId,
    Math.floor(Math.random() * Number(projectData.participantsCount))
  );
  console.log("== Détails du Participant ==");
  console.log("Adresse   :", participantData.participantAddress);
  console.log("Username  :", participantData.username);
  console.log("TokenId   :", participantData.tokenId.toString());

  // 6. Récupérer et décoder les métadonnées du NFT minté via le contrat RhizomeNFT
  if (participantData.tokenId > 0) {
    const metadataURI = await rhizomeNFT.tokenURI(participantData.tokenId); 
    console.log("Metadata URI :", metadataURI);
    const base64Data = metadataURI.split("base64,")[1];
    const decodedMetadata = Buffer.from(base64Data, "base64").toString("utf8");
    console.log("=== Métadonnées Décodées du NFT ===");
    console.log(decodedMetadata);
    const metadata = JSON.parse(decodedMetadata);
    console.log("=== metadata ===");
    console.dir(metadata, { depth: null, colors: true });
    console.log("==================================");
  } else {
    console.log("Aucun NFT minté pour le participant.");
  }

  const allProjects = await projectsRegistry.getAllProjects();
  //allProjects.wait();
  console.log("=== allProjects === testMintFinal.js === key: 739435 ===");
  console.dir(allProjects, { depth: null, colors: true });
  console.log("=================================");

  await new Promise((resolve) => setTimeout(resolve, 3000));



  const nfts = await projectsRegistry.getNFTsForProject(projectId);
  //nfts.wait();
  console.log("=== nfts === testMintFinal.js === key: 340054 ===");
  console.dir(nfts, { depth: null, colors: true });
  console.log("=================================");

  console.log("Fin du script testMintFinal.js");
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

import pkg from "hardhat";
const { ethers, network } = pkg;
import fs from "fs";
import KeyUtils from "../../config/keyutils.js";
//import {KeyUtils} from "#config";
//import KeyUtils from "/Users/ludiq/.wallets/keyutils.js";

console.log("=== network.name === deploy.js === key: 594784 ===");
console.dir(network.name, { depth: null, colors: true });
console.log("=================================");

let secretKey;
try {
  secretKey = KeyUtils.getKey(process.env.MASTER_KEY_PASSWORD, process.env.MASTER_KEY_ID);
} catch (error) {
  console.log('=== error === deploy.js === key: 442178 ===');
  console.dir(error, { depth: null, colors: true })
  console.log('=================================');
  process.exit(1);
}

const main = async () => {
  console.log("Déploiement en cours sur", network.name);

  // 1. Connexion du déployeur
  const deployer = network.name === "localhost"
    ? (await ethers.getSigners())[0]
    : new ethers.Wallet(secretKey, ethers.provider);
  console.log("Adresse du deployer :", deployer.address);

  // 2. Attente des éventuelles TX pending
  const confirmed = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pending   = await ethers.provider.getTransactionCount(deployer.address, "pending");
  if (pending > confirmed) {
    console.log(`Vous avez ${pending - confirmed} transaction(s) en attente. J'attends leur minage…`);
    // boucle de polling toutes les 15 s
    while (
      (await ethers.provider.getTransactionCount(deployer.address, "pending")) >
      (await ethers.provider.getTransactionCount(deployer.address, "latest"))
    ) {
      await new Promise(r => setTimeout(r, 15_000));
    }
    console.log("–> Toutes les transactions précédentes sont désormais minées.");
  }

  // 3. Déploiement du contrat NFT
  console.log("Déploiement de RhizomeNFT…");
  const RhizomeNFTFactory = await ethers.getContractFactory("RhizomeNFT", deployer);
  const rhizomeNFT = await RhizomeNFTFactory.deploy();
  await rhizomeNFT.waitForDeployment();
  const nftAddress = await rhizomeNFT.getAddress();
  console.log("RhizomeNFT déployé à :", nftAddress);

  // 4. Déploiement du Registry
  console.log("Déploiement de ProjectsRegistry…");
  const ProjectsRegistryFactory = await ethers.getContractFactory("ProjectsRegistry", deployer);
  const projectsRegistry = await ProjectsRegistryFactory.deploy(nftAddress);
  await projectsRegistry.waitForDeployment();
  const registryAddress = await projectsRegistry.getAddress();
  console.log("ProjectsRegistry déployé à :", registryAddress);

  // 5. Transfert de la propriété du NFT vers le Registry
  let nftOwner = await rhizomeNFT.owner();
  console.log("Avant transfert, NFT owner :", nftOwner);

  const txTransfer = await rhizomeNFT.transferOwnership(registryAddress);
  await txTransfer.wait();
  nftOwner = await rhizomeNFT.owner();
  console.log("Après transfert, NFT owner :", nftOwner);

  // 6. Enregistrement des adresses déployées
  const now = new Date().toISOString();
  const networkName = network.name;
  const txtFile = `src/web3/deployed/deployed-contracts-${networkName}.txt`;
  const jsonFile = `src/web3/deployed/deployed-contracts-${networkName}.json`;

  const outputData = `Déploiement effectué le ${now}
RhizomeNFT: ${nftAddress}
ProjectsRegistry: ${registryAddress}
`;
  const outputJson = JSON.stringify({
    date: now,
    rhizomeNFT: nftAddress,
    projectsRegistry: registryAddress,
  }, null, 2);

  fs.writeFileSync(txtFile, outputData);
  fs.writeFileSync(jsonFile, outputJson);
  console.log(`Adresses enregistrées dans ${txtFile} et ${jsonFile}`);

  console.log("✅ Déploiement terminé.");
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Erreur de déploiement :", error);
    process.exit(1);
  });

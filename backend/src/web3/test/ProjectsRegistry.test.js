import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { ethers as ethersjs } from "ethers";

const ZERO_ADDRESS = ethersjs.ZeroAddress;
const ZERO_HASH = ethersjs.ZeroHash;

// Paramètres NFT supplémentaires
const nftImageUrl = "https://example.com/nft.png";
const defaultParticipantRole = ["Collaborator"];
const defaultParticipantContribution = ["50%"];
const nftFinalDate = "2025-04-09";

describe("ProjectsRegistry", function () {
  let projectsRegistry;
  let rhizomeNFT;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Déploiement du contrat RhizomeNFT
    const RhizomeNFTFactory = await ethers.getContractFactory("RhizomeNFT");
    rhizomeNFT = await RhizomeNFTFactory.deploy();
    await rhizomeNFT.waitForDeployment();

    // Déploiement du contrat ProjectsRegistry avec l'adresse du NFT
    const ProjectsRegistryFactory = await ethers.getContractFactory("ProjectsRegistry");
    projectsRegistry = await ProjectsRegistryFactory.deploy(rhizomeNFT.target);
    await projectsRegistry.waitForDeployment();

    // Transfert de la propriété du NFT au contrat ProjectsRegistry
    const tx = await rhizomeNFT.transferOwnership(projectsRegistry.target);
    await tx.wait();
  });

  describe("Deployment", function () {
    it("should deploy with correct owner and initial NFT contract address", async function () {
      expect(await projectsRegistry.owner()).to.equal(owner.address);
      expect(await projectsRegistry.nftContractAddress()).to.equal(rhizomeNFT.target);
    });
  });

  describe("Whitelist", function () {
    it("should allow only whitelisted addresses to register a project when whitelist is enabled", async function () {
      // Activer la whitelist
      await (await projectsRegistry.setWhitelistEnabled(true)).wait();
    
      const projectChain = "Project for whitelist test";
      const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));
      
      // Tentative sans être whitelisté (doit échouer)
      await expect(
        projectsRegistry.connect(addr1).registerProject(
          "w1",
          projectChain,
          "http://example.com/whitelist",
          "Whitelist Test",
          projectHash,
          [addr1.address],
          ["Alice"],
          [await addr1.signMessage(ethersjs.getBytes(projectHash))],
          "https://example.com/nft.png",   // nftImageUrl
          ["TestRole"],                     // participantRole (tableau)
          ["10%"],                          // participantContributionPercentage (tableau)
          "2023-12-31"                      // nftFinalizationDate
        )
      ).to.be.reverted;

      // Ajout de addr1 à la whitelist
      await expect(projectsRegistry.addToWhitelist(addr1.address))
        .to.emit(projectsRegistry, "WhitelistUpdated")
        .withArgs(addr1.address, true);

      // Maintenant, addr1 peut enregistrer un projet
      const tx2 = await projectsRegistry.connect(addr1).registerProject(
        "w2",
        projectChain,
        "http://example.com/whitelist2",
        "Whitelist Test 2",
        projectHash,
        [addr1.address],
        ["Alice"],
        [await addr1.signMessage(ethersjs.getBytes(projectHash))],
        "https://example.com/nft.png",
        ["TestRole"],
        ["10%"],
        "2023-12-31"
      );
      await tx2.wait();

      const projectData = await projectsRegistry.getProject("w2");
      expect(projectData.title).to.equal("Whitelist Test 2");
    
      // Retrait de addr1 de la whitelist
      await expect(projectsRegistry.removeFromWhitelist(addr1.address))
        .to.emit(projectsRegistry, "WhitelistUpdated")
        .withArgs(addr1.address, false);
    });

    it("should allow the owner to enable and disable whitelist", async function () {
      await (await projectsRegistry.setWhitelistEnabled(true)).wait();
      expect(await projectsRegistry.whitelistEnabled()).to.equal(true);
      await (await projectsRegistry.setWhitelistEnabled(false)).wait();
      expect(await projectsRegistry.whitelistEnabled()).to.equal(false);
    });
  });

  describe("registerProject", function () {
    it("should register a project correctly with one participant", async function () {
      const projectId = "project1-" + Math.floor(Math.random() * 1000);
      const projectChain = "This is a test project chain.";
      const url = "http://example.com";
      const title = "Test Project";
      const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));

      const participantAddresses = [addr1.address];
      const participantUsernames = ["Alice"];
      const signature1 = await addr1.signMessage(ethersjs.getBytes(projectHash));
      const participantSignatures = [signature1];
      const participantRoles = ["defaultParticipantRole"];
      const participantContributions = ["defaultParticipantContribution"];

      let tx;
      try {
        tx = await projectsRegistry.registerProject(
          projectId,
          projectChain,
          url,
          title,
          projectHash,
          participantAddresses,
          participantUsernames,
          participantSignatures,
          "https://example.com/image.png",
          participantRoles,
          participantContributions,
          nftFinalDate
        );
      } catch (error) {
        console.log('=== error === ProjectsRegistry.test.js === key: 524386 ===');
        console.dir(error, { depth: null, colors: true })
        console.log('=================================');
      }
      await tx.wait();

      const projectData = await projectsRegistry.getProject(projectId);
      expect(projectData.title).to.equal(title);
      expect(projectData.url).to.equal(url);
      expect(projectData.projectHash).to.equal(projectHash);
      expect(projectData.participantsCount).to.equal(1);

      const participantData = await projectsRegistry.getParticipant(projectId, 0);
      expect(participantData.participantAddress).to.equal(addr1.address);
      expect(participantData.username).to.equal("Alice");
    });

    it("should fail registration if hash mismatch", async function () {
      const projectId = "project2";
      const projectChain = "This is a test project chain.";
      const url = "http://example.com";
      const title = "Test Project 2";
      const wrongHash = ZERO_HASH;

      const participantAddresses = [addr1.address];
      const participantUsernames = ["Alice"];
      const signature1 = await addr1.signMessage(ethersjs.getBytes(wrongHash));
      const participantSignatures = [signature1];

      await expect(
        projectsRegistry.registerProject(
          projectId,
          projectChain,
          url,
          title,
          wrongHash,
          participantAddresses,
          participantUsernames,
          participantSignatures,
          "https://example.com/image.png",
          defaultParticipantRole,
          defaultParticipantContribution,
          nftFinalDate
        )
      ).to.be.revertedWith("Project hash mismatch");
    });

    it("should fail registration if signature is invalid", async function () {
      const projectId = "project3";
      const projectChain = "Another test project chain.";
      const url = "http://example.com/project3";
      const title = "Test Project 3";
      const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));

      const participantAddresses = [addr1.address];
      const participantUsernames = ["Alice"];
      // Utilisation de addr2 pour signer alors que le participant attendu est addr1
      const wrongSignature = await addr2.signMessage(ethersjs.getBytes(projectHash));
      const participantSignatures = [wrongSignature];

      await expect(
        projectsRegistry.registerProject(
          projectId,
          projectChain,
          url,
          title,
          projectHash,
          participantAddresses,
          participantUsernames,
          participantSignatures,
          "https://example.com/image.png",
          defaultParticipantRole,
          defaultParticipantContribution,
          nftFinalDate
        )
      ).to.be.revertedWith("Invalid signature for participant");
    });

    it("should register multiple projects and retrieve them", async function () {
      // Premier projet
      const projectId1 = "p1";
      const projectChain1 = "Project chain 1";
      const url1 = "http://project1.com";
      const title1 = "Project 1";
      const projectHash1 = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain1));
      const sig1 = await addr1.signMessage(ethersjs.getBytes(projectHash1));
      await projectsRegistry.registerProject(
        projectId1,
        projectChain1,
        url1,
        title1,
        projectHash1,
        [addr1.address],
        ["Alice"],
        [sig1],
        nftImageUrl,
        defaultParticipantRole,
        defaultParticipantContribution,
        nftFinalDate
      );

      // Deuxième projet
      const projectId2 = "p2";
      const projectChain2 = "Project chain 2";
      const url2 = "http://project2.com";
      const title2 = "Project 2";
      const projectHash2 = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain2));
      const sig2 = await addr2.signMessage(ethersjs.getBytes(projectHash2));
      await projectsRegistry.registerProject(
        projectId2,
        projectChain2,
        url2,
        title2,
        projectHash2,
        [addr2.address],
        ["Bob"],
        [sig2],
        nftImageUrl,
        defaultParticipantRole,
        defaultParticipantContribution,
        nftFinalDate
      );

      const allProjects = await projectsRegistry.getAllProjects();
      expect(allProjects.ids.length).to.equal(2);
      expect(allProjects.ids[0]).to.equal(projectId1);
      expect(allProjects.ids[1]).to.equal(projectId2);
    });

    it("should not allow duplicate project registration", async function () {
      const projectId = "dupProject";
      const projectChain = "Duplicate project chain.";
      const url = "http://example.com/dup";
      const title = "Duplicate Project";
      const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));
      const participantAddresses = [addr1.address];
      const participantUsernames = ["Alice"];
      const sig1 = await addr1.signMessage(ethersjs.getBytes(projectHash));
      const participantSignatures = [sig1];

      // Première inscription
      await projectsRegistry.registerProject(
        projectId,
        projectChain,
        url,
        title,
        projectHash,
        participantAddresses,
        participantUsernames,
        participantSignatures,
        nftImageUrl,
        defaultParticipantRole,
        defaultParticipantContribution,
        nftFinalDate
      );

      // Tentative de doublon
      await expect(
        projectsRegistry.registerProject(
          projectId,
          projectChain,
          url,
          title,
          projectHash,
          participantAddresses,
          participantUsernames,
          participantSignatures,
          nftImageUrl,
          defaultParticipantRole,
          defaultParticipantContribution,
          nftFinalDate
        )
      ).to.be.revertedWith("Project already registered");
    });
  });

  describe("NFT Contract Setter", function () {
    it("should allow owner to update NFT contract address", async function () {
      const newNFTAddress = addr3.address;
      await expect(projectsRegistry.setNFTContractAddress(newNFTAddress))
        .to.emit(projectsRegistry, "NFTContractAddressSet")
        .withArgs(newNFTAddress);
      expect(await projectsRegistry.nftContractAddress()).to.equal(newNFTAddress);
    });

    it("should not allow non-owner to update NFT contract address", async function () {
      const newNFTAddress = addr3.address;
      await expect(
        projectsRegistry.connect(addr1).setNFTContractAddress(newNFTAddress)
      ).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("should revert when accessing a participant with an invalid index", async function () {
      const projectId = "edgeCase";
      const projectChain = "Edge case project chain.";
      const url = "http://example.com/edge";
      const title = "Edge Case Project";
      const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));
      const participantAddresses = [addr1.address];
      const participantUsernames = ["Alice"];
      const sig1 = await addr1.signMessage(ethersjs.getBytes(projectHash));
      const participantSignatures = [sig1];

      await projectsRegistry.registerProject(
        projectId,
        projectChain,
        url,
        title,
        projectHash,
        participantAddresses,
        participantUsernames,
        participantSignatures,
        nftImageUrl,
        defaultParticipantRole,
        defaultParticipantContribution,
        nftFinalDate
      );

      await expect(projectsRegistry.getParticipant(projectId, 1))
        .to.be.revertedWith("Participant index out of bounds");
    });
  });

  describe("Event Emissions", function () {
    it("should emit ProjectRegistered and ParticipantAdded events on registerProject", async function () {
      const projectId = "eventTest";
      const projectChain = "Project for event test.";
      const url = "http://example.com/event";
      const title = "Event Test Project";
      const projectHash = ethersjs.sha256(ethersjs.toUtf8Bytes(projectChain));
      const participantAddresses = [addr1.address];
      const participantUsernames = ["Alice"];
      const sig1 = await addr1.signMessage(ethersjs.getBytes(projectHash));
      const participantSignatures = [sig1];

      await expect(
        projectsRegistry.registerProject(
          projectId,
          projectChain,
          url,
          title,
          projectHash,
          participantAddresses,
          participantUsernames,
          participantSignatures,
          nftImageUrl,
          defaultParticipantRole,
          defaultParticipantContribution,
          nftFinalDate
        )
      )
        .to.emit(projectsRegistry, "ProjectRegistered")
        .withArgs(projectId, title)
        .and.to.emit(projectsRegistry, "ParticipantAdded")
        .withArgs(projectId, addr1.address);
    });
  });
});
import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { ethers as ethersjs } from "ethers";

// Données de test pour le NFT
const testData = {
  projectId: "proj123",
  projectTitle: "Projet Alpha",
  projectUrl: "https://rhizome.io/projects/projet-alpha",
  imageUrl: "https://rhizome.io/images/projet-alpha.png",
  role: "Collaborateur",
  contributionPercentage: "50%",
  finalizationDate: "2023-10-01"
};

describe("RhizomeNFT", function () {
  let rhizomeNFT;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const RhizomeNFTFactory = await ethers.getContractFactory("RhizomeNFT");
    rhizomeNFT = await RhizomeNFTFactory.deploy();
    await rhizomeNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await rhizomeNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should allow the owner to mint an NFT", async function () {
      const tx = await rhizomeNFT.mintNFT(
        addr1.address,
        testData.projectId,
        testData.projectTitle,
        testData.projectUrl,
        testData.imageUrl,
        testData.role,
        testData.contributionPercentage,
        testData.finalizationDate
      );
      const receipt = await tx.wait();
      // Pour le premier NFT minté, nous attendons tokenId = 1
      const tokenId = 1;
      expect(await rhizomeNFT.ownerOf(tokenId)).to.equal(addr1.address);
    });

    it("should not allow a non-owner to mint an NFT", async function () {
      await expect(
        rhizomeNFT.connect(addr1).mintNFT(
          addr1.address,
          testData.projectId,
          testData.projectTitle,
          testData.projectUrl,
          testData.imageUrl,
          testData.role,
          testData.contributionPercentage,
          testData.finalizationDate
        )
      ).to.be.reverted;

    });

    it("should return a valid tokenURI containing the metadata", async function () {
      await rhizomeNFT.mintNFT(
        addr1.address,
        testData.projectId,
        testData.projectTitle,
        testData.projectUrl,
        testData.imageUrl,
        testData.role,
        testData.contributionPercentage,
        testData.finalizationDate
      );
      const tokenId = 1;
      const uri = await rhizomeNFT.tokenURI(tokenId);
      expect(uri).to.contain("data:application/json;base64,");
      // Décodage rapide pour vérifier quelques informations
      const base64Part = uri.split("base64,")[1];
      const decoded = Buffer.from(base64Part, "base64").toString("utf8");
      expect(decoded).to.contain(testData.projectTitle);
      expect(decoded).to.contain(testData.projectUrl);
      expect(decoded).to.contain(testData.role);
    });

    it("should revert tokenURI query for a nonexistent token", async function () {
      await expect(rhizomeNFT.tokenURI(9999)).to.be.revertedWith(
        "RhizomeNFT: URI query for nonexistent token"
      );
    });
  });

  describe("Non-transferability", function () {
    let tokenId;
    beforeEach(async function () {
      await rhizomeNFT.mintNFT(
        addr1.address,
        testData.projectId,
        testData.projectTitle,
        testData.projectUrl,
        testData.imageUrl,
        testData.role,
        testData.contributionPercentage,
        testData.finalizationDate
      );
      tokenId = 1;
    });

    it("should revert transferFrom attempts", async function () {
      await expect(
        rhizomeNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId)
      ).to.be.revertedWith("RhizomeNFT: This NFT is non-transferable");
    });

    it("should revert safeTransferFrom attempts", async function () {
      await expect(
        rhizomeNFT.connect(addr1).safeTransferFrom(addr1.address, addr2.address, tokenId)
      ).to.be.revertedWith("RhizomeNFT: This NFT is non-transferable");
    });
  });
});

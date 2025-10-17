// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IRhizomeNFT {
    function mintNFT(
        address recipient,
        string memory projectId,
        string memory participantId,
        string memory participantFullname,
        string memory participantUsername,
        string memory projectTitle,
        string memory projectUrl,
        string memory imageUrl,
        string memory role,
        string memory contributionPercentage,
        string memory contributionDescription,
        string memory finalizationDate
    ) external returns (uint256);
}

contract ProjectsRegistry is Ownable {
    using ECDSA for bytes32;

    // Structure d'un Participant
    struct Participant {
        address participantAddress;
        string participantId; // ID unique du participant
        string fullname;
        string username; // Nom d'utilisateur du participant
        bytes signature;
        string role; // Rôle du participant
        string contributionPercentage; // Pourcentage de contribution
        string contributionDescription; // Description de la contribution
        uint256 tokenId; // Token ID minté par le contrat NFT (0 si non minté)
    }

    // Structure d'un Projet
    struct Project {
        string projectChain; // La chaîne brute représentant le projet
        string url; // L'URL où le projet est consultable
        string title; // Le titre du projet
        bytes32 projectHash; // Le hash calculé du projet (SHA‑256 du projectChain)
        Participant[] participants;
    }

    // Mapping reliant l'ID du projet à ses informations
    mapping(string => Project) private projects;
    // Tableau pour garder l'historique des IDs de projets enregistrés
    string[] private projectIds;

    // Gestion de la whitelist
    bool public whitelistEnabled;
    mapping(address => bool) public whitelist;

    // Adresse du contrat NFT (setter modifiable par le deployer)
    address public nftContractAddress;
    IRhizomeNFT public nftContract;

    // Évènements pour le suivi des actions sur le contrat Registry
    event ProjectRegistered(string projectId, string title);
    event ParticipantAdded(string projectId, address participant, string participantId);
    event NFTMintedForParticipant(
        string projectId,
        string participantId,
        address participant,
        uint256 tokenId
    );
    event NFTContractAddressSet(address nftAddress);
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event WhitelistStatusChanged(bool enabled);

    constructor(address _nftAddress) Ownable(msg.sender) {
        nftContractAddress = _nftAddress;
        nftContract = IRhizomeNFT(_nftAddress);
    }

    /**
     * @dev Permet au deployer d'ajouter une adresse à la whitelist.
     */
    function addToWhitelist(address _addr) external onlyOwner {
        whitelist[_addr] = true;
        emit WhitelistUpdated(_addr, true);
    }

    /**
     * @dev Permet au deployer de retirer une adresse de la whitelist.
     */
    function removeFromWhitelist(address _addr) external onlyOwner {
        whitelist[_addr] = false;
        emit WhitelistUpdated(_addr, false);
    }

    /**
     * @dev Permet d'activer ou désactiver l'utilisation de la whitelist.
     * Seul le deployer (owner) peut appeler cette fonction.
     */
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
        emit WhitelistStatusChanged(_enabled);
    }

    /**
     * @dev Setter de l'adresse du contrat NFT.
     * Accessible uniquement par le deployer (owner).
     */
    function setNFTContractAddress(address _nftAddress) external onlyOwner {
        nftContractAddress = _nftAddress;
        nftContract = IRhizomeNFT(_nftAddress);
        emit NFTContractAddressSet(_nftAddress);
    }

    /**
     * @dev Enregistre un projet et mint les NFT pour ses participants.
     *
     * @param _projectId Identifiant unique du projet.
     * @param _projectChain La chaîne brute représentant le projet.
     * @param _url L'URL où le projet est consultable.
     * @param _title Le titre du projet.
     * @param _projectHash Le hash (SHA‑256) du projet transmis depuis le backend.
     * @param _participantAddresses Tableau d'adresses des participants.
     * @param _participantFullnames Tableau de noms des participants.
     * @param _participantUsernames Tableau de usernames des participants.
     * @param _participantSignatures Tableau des signatures (en bytes) des participants.
     * @param _nftImageUrl L'URL de l'image à utiliser pour les NFT.
     * @param _participantRole Le rôle à afficher sur le NFT.
     * @param _participantContributionPercentage Le pourcentage de contribution à afficher sur le NFT.
     * @param _participantContributionDescription La description de la contribution à afficher sur le NFT.
     * @param _nftFinalizationDate La date de finalisation du projet à afficher sur le NFT.
     *
     * Émet un event ProjectRegistered et pour chaque participant un event ParticipantAdded et NFTMintedForParticipant.
     */
    function registerProject(
        string memory _projectId,
        string memory _projectChain,
        string memory _url,
        string memory _title,
        bytes32 _projectHash,
        address[] memory _participantAddresses,
        string[] memory _participantIds,
        string[] memory _participantFullnames,
        string[] memory _participantUsernames,
        bytes[] memory _participantSignatures,
        string memory _nftImageUrl,
        string[] memory _participantRole,
        string[] memory _participantContributionPercentage,
        string[] memory _participantContributionDescription,
        string memory _nftFinalizationDate
    ) external {
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Sender not whitelisted");
        }
        require(
            sha256(bytes(_projectChain)) == _projectHash,
            "Project hash mismatch"
        );
        require(
            _participantAddresses.length == _participantUsernames.length &&
                _participantAddresses.length == _participantFullnames.length &&
                _participantAddresses.length == _participantSignatures.length &&
                _participantAddresses.length == _participantRole.length &&
                _participantAddresses.length ==
                _participantContributionPercentage.length &&
                _participantAddresses.length == _participantIds.length
                && _participantContributionDescription.length == _participantAddresses.length,
            "Participants arrays must have the same length"
        );
        require(
            bytes(projects[_projectId].projectChain).length == 0,
            "Project already registered"
        );

        // Création du projet
        Project storage proj = projects[_projectId];
        proj.projectChain = _projectChain;
        proj.url = _url;
        proj.title = _title;
        proj.projectHash = _projectHash;

        // Traitement de chaque participant
        for (uint256 i = 0; i < _participantAddresses.length; i++) {
            bytes32 ethHash = keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _projectHash
                )
            );
            address recoveredAddress = ethHash.recover(
                _participantSignatures[i]
            );
            require(
                recoveredAddress == _participantAddresses[i],
                "Invalid signature for participant"
            );

            // Ajout du participant sans tokenId (0 pour l'instant)
            proj.participants.push(
                Participant({
                    participantAddress: _participantAddresses[i],
                    participantId: _participantIds[i],
                    fullname: _participantFullnames[i],
                    username: _participantUsernames[i],
                    signature: _participantSignatures[i],
                    role: _participantRole[i],
                    contributionPercentage: _participantContributionPercentage[
                        i
                    ],
                    contributionDescription: _participantContributionDescription[i],
                    tokenId: 0
                })
            );
            emit ParticipantAdded(_projectId, _participantAddresses[i], _participantIds[i]);
        }

        // Enregistrer l'ID du projet
        projectIds.push(_projectId);
        emit ProjectRegistered(_projectId, _title);

        // Pour chaque participant, appeler mintNFT du contrat NFT
        for (uint256 i = 0; i < proj.participants.length; i++) {
            uint256 mintedTokenId = nftContract.mintNFT(
                proj.participants[i].participantAddress,
                _projectId,
                proj.participants[i].participantId,
                proj.participants[i].fullname,
                proj.participants[i].username,
                _title,
                _url,
                _nftImageUrl,
                proj.participants[i].role,
                proj.participants[i].contributionPercentage,
                proj.participants[i].contributionDescription,
                _nftFinalizationDate
            );
            // Mettre à jour le tokenId pour le participant
            proj.participants[i].tokenId = mintedTokenId;
            emit NFTMintedForParticipant(
                _projectId,
                proj.participants[i].participantId,
                proj.participants[i].participantAddress,
                mintedTokenId
            );
        }
    }

    function getProject(
        string memory _projectId
    )
        external
        view
        returns (
            string memory projectChain,
            string memory url,
            string memory title,
            bytes32 projectHash,
            uint256 participantsCount
        )
    {
        Project storage proj = projects[_projectId];
        return (
            proj.projectChain,
            proj.url,
            proj.title,
            proj.projectHash,
            proj.participants.length
        );
    }

    function getParticipant(
        string memory _projectId,
        uint256 _index
    )
        external
        view
        returns (
            address participantAddress,
            string memory participantId,
            string memory fullname,
            string memory username,
            bytes memory signature,
            uint256 tokenId
        )
    {
        Project storage proj = projects[_projectId];
        require(
            _index < proj.participants.length,
            "Participant index out of bounds"
        );
        Participant storage part = proj.participants[_index];
        return (
            part.participantAddress,
            part.participantId,
            part.fullname,
            part.username,
            part.signature,
            part.tokenId
        );
    }

    function getAllProjects()
        external
        view
        returns (
            string[] memory ids,
            string[] memory chains,
            string[] memory urls,
            string[] memory titles
        )
    {
        uint256 total = projectIds.length;
        ids = new string[](total);
        chains = new string[](total);
        urls = new string[](total);
        titles = new string[](total);

        for (uint256 i = 0; i < total; i++) {
            string storage id = projectIds[i];
            Project storage proj = projects[id];
            ids[i] = id;
            chains[i] = proj.projectChain;
            urls[i] = proj.url;
            titles[i] = proj.title;
        }
    }

    function getNFTsForProject(
        string memory _projectId
    )
        external
        view
        returns (string[] memory usernames, string[] memory participantIds, uint256[] memory tokenIds)
    {
        Project storage proj = projects[_projectId];
        uint256 count = proj.participants.length;
        usernames = new string[](count);
        participantIds = new string[](count);
        tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            usernames[i] = proj.participants[i].username;
            participantIds[i] = proj.participants[i].participantId;
            tokenIds[i] = proj.participants[i].tokenId;
        }
        return (usernames, participantIds, tokenIds);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// Retirez les overrides de transferFrom et safeTransferFrom

contract RhizomeNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    struct NFTData {
        string projectId;
        string participantId;
        string participantFullname; // Nom du participant
        string participantUsername; // Nom d'utilisateur du participant
        string projectTitle;
        string projectUrl;
        string imageUrl;
        string role;
        string contributionPercentage;
        string contributionDescription; // Description de la contribution
        string finalizationDate;
    }

    mapping(uint256 => NFTData) private _nftData;

    constructor() ERC721("Rhizome Protocol Net", "RHZ") Ownable(msg.sender) {}

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
    ) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(recipient, newTokenId);
        _nftData[newTokenId] = NFTData({
            projectId: projectId,
            participantId: participantId,
            participantFullname: participantFullname,
            participantUsername: participantUsername,
            projectTitle: projectTitle,
            projectUrl: projectUrl,
            imageUrl: imageUrl,
            role: role,
            contributionPercentage: contributionPercentage,
            contributionDescription: contributionDescription,
            finalizationDate: finalizationDate
        });
        return newTokenId;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        // Vérifie que le token existe
        try this.ownerOf(tokenId) returns (address) {
            // OK, le token existe
        } catch {
            revert("RhizomeNFT: URI query for nonexistent token");
        }

        NFTData memory data = _nftData[tokenId];

        // Construction du JSON encodé en Base64
        string memory json = Base64.encode(
            bytes(
                abi.encodePacked(
                    unicode'{"name":"',
                    data.projectTitle,
                    unicode'","description":"Ce NFT atteste de la participation de ',
                    data.participantFullname,
                    unicode" (@",
                    data.participantUsername,
                    unicode") au projet ",
                    data.projectTitle,
                    unicode". Consultez le projet ici : ",
                    data.projectUrl,
                    unicode'","image":"',
                    data.imageUrl,
                    unicode'","attributes":[',
                    unicode'{"trait_type":"project_id","value":"',
                    data.projectId,
                    unicode'"},',
                    unicode'{"trait_type":"participant_id","value":"',
                    data.participantId,
                    unicode'"},',
                    unicode'{"trait_type":"role","value":"',
                    data.role,
                    unicode'"},',
                    unicode'{"trait_type":"percentage_contribution","value":"',
                    data.contributionPercentage,
                    unicode'"},',
                    unicode'{"trait_type":"description_contribution","value":"',
                    data.contributionDescription,
                    unicode'"},',
                    unicode'{"trait_type":"terminated_at","value":"',
                    data.finalizationDate,
                    unicode'"},',
                    unicode'{"trait_type":"project_url","value":"',
                    data.projectUrl,
                    unicode'"}',
                    unicode"]}"
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev Empêche le transfert des tokens en surchargeant _update.
     * La fonction _update est utilisée dans _mint et _transfer.
     * Lors d'un mint, from == address(0) : autorisé.
     * Lors d'un transfert, from != address(0) et to != address(0) : rejet.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("RhizomeNFT: This NFT is non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}

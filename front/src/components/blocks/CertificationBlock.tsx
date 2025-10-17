import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getNFTsForProject } from "@/api/blockchain";
import Config from "@config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SafeJson from "@/utils/jsonUtils";

export const CertificationBlock = ({ projectId, project }) => {
  const [nfts, setNfts] = useState([]);
  
  const [copied, setCopied] = useState<string | null>(null);

  const nftParticipants = project?.participants || []
    .concat(project?.author || [])
    .concat(project?.contributors || []);
  nftParticipants.push(project?.author);

  console.log('=== nftParticipants === CertificationBlock.tsx === key: 319792 ===');
  console.dir(nftParticipants, { depth: null, colors: true })
  console.log('=================================');

  useEffect(() => {
    const fetchNFTs = async () => {
      const nftsResult = await getNFTsForProject(projectId);

      if (nftsResult.success === false) {
        console.error("Error fetching NFTs:", nftsResult);
        return;
      }

      if (nftsResult && nftsResult.length > 0) {
        setNfts(nftsResult);
      }
    };

    fetchNFTs();
  }, [projectId]);

  if (!nfts.length) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Certification NFT {projectId || "none"}</h3>
          <p className="text-gray-500">
            Ce projet ne dispose pas encore de certification NFT.
          </p>
        </div>
      </Card>
    );
  }

  // Extraction des tableaux dans l'ordre attendu:
  // 0: usernames (identifiants de profils, ex: 'bob-perso-1')
  // 1: participantIds
  // 2: tokenIds
  // 3: détails JSON du NFT
  // 4: détails utilisateurs (objets contenant first_name, last_name, username, contractAddress, etc.)
  const [usernames, participantIds, tokenIds, jsonStrings, userDetails] = nfts;

  console.log('=== jsonStrings === CertificationBlock.tsx === key: 686289 ===');
  console.dir(jsonStrings, { depth: null, colors: true })
  console.log('=================================');

  // Transformation des données : on reconstruit un objet par NFT
  const nftList = jsonStrings
    .map((jsonStr, index) => {
      try {
        const details = SafeJson.parse(jsonStr);
        const attributes = {};
        if (Array.isArray(details.attributes)) {
          details.attributes.forEach(attr => {
            attributes[attr.trait_type] = attr.value;
          });
        }
        // Récupération des infos utilisateur depuis le 5e tableau
        const user = userDetails[index];
        return {
          displayName: usernames[index],
          participantId: participantIds[index],
          tokenId: tokenIds[index],
          ...details,
          attributes,
          user, // contient first_name, last_name, username, contractAddress, etc.
        };
      } catch (error) {
        console.error("Erreur lors du parsing du JSON à l'index", index, error);
        return null;
      }
    })
    .filter(nft => nft !== null);

  // Fonction de copie dans le presse-papier avec rétroaction
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(url);
        setTimeout(() => setCopied(null), 1500); // affiche "copié" pendant 1.5 sec
      })
      .catch(err => console.error("Erreur lors de la copie dans le presse-papier", err));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-4">Certifications NFT</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nftList.map((nft, idx) => {
          // Calcul du nom d'affichage de l'utilisateur : prénom + nom s'ils sont renseignés, sinon le username.
          const fullName =
            nft.user.first_name || nft.user.last_name
              ? `${nft.user.first_name} ${nft.user.last_name}`.trim()
              : nft.user.collectif_name ? nft.user.collectif_name : nft.user.username;
          // Construction de l'URL vers le block explorer.
          const explorerUrl = `https://optimistic.etherscan.io/token/${nft.user.contractAddress}?a=${nft.tokenId}`;
          const downloadNftUrl = `${Config.API_URL}/nft/${nft.user.contractAddress}/${nft.tokenId}`;

          const avatarSrc = nftParticipants.find(
            participant => participant.id === nft.participantId
          )?.avatar || "/default-avatar.png";

          return (
            <Card key={idx} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{nft.name}</h3>
                <Badge variant="secondary">Certifié</Badge>
              </div>
              <div className="relative flex justify-center mb-4">
                <img 
                  src={nft.image} 
                  alt={`Image de ${nft.name}`} 
                  className="w-[150px] h-auto shadow-lg rounded-lg"
                />
                {/* Avatar superposé en bas à droite */}
                <div className="absolute bottom-0 center-x translate-x-16 translate-y-1/4">
                  <Avatar
                    key={Math.random()}
                    className="h-8 w-8 border-2 border-white hover:z-10 cursor-pointer"
                    onClick={(e) => {}}
                  >
                    <AvatarImage
                      src={avatarSrc}
                      alt="Avatar de l'utilisateur"
                    />
                    <AvatarFallback>UA</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{nft.description}</p>
              <div className="space-y-4">
                {nft.attributes.finalizationDate && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Date de création:</span>
                    <span>{nft.attributes.finalizationDate}</span>
                  </div>
                )}
                {nft.attributes.role && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Rôle:</span>
                    <span>{nft.attributes.role}</span>
                  </div>
                )}
                {nft.attributes.percentage_contribution && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Contribution:</span>
                    <span>{nft.attributes.percentage_contribution}</span>
                  </div>
                )}
                <div>
                  <p className=" text-lg rounded">
                  {nft.attributes.description_contribution}
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold">Contract:</h4>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {nft.attributes.contract || nft.user?.contractAddress || 'N/A'}
                  </p>
                </div>
                {nft.attributes.blockchain && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Blockchain:</span>
                    <span>{nft.attributes.blockchain}</span>
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">Token ID:</h4>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {nft.tokenId}
                  </p>
                </div>
                {nft.attributes.standard && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Standard:</span>
                    <span>{nft.attributes.standard}</span>
                  </div>
                )}
              </div>
              {/* Affichage des infos utilisateur */}
              <div className="mt-4">
                <span className="font-semibold">Utilisateur :</span>{" "}
                <a
                  href={`${Config.ENDPOINT_URL}profile/${nft.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {fullName}
                </a>
              </div>
              {/* Bouton pour afficher le NFT sur la blockchain */}
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 text-blue-500 hover:text-blue-600"
                  onClick={() => window.open(explorerUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir le NFT sur la blockchain
                </Button>
              </div>
              {/* Bouton pour copier le lien du NFT dans le presse-papier */}
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 text-blue-500 hover:text-blue-600"
                  onClick={() => handleCopy(downloadNftUrl)}
                >
                  <Copy className="w-4 h-4" />
                  {(copied === downloadNftUrl)  ? "Lien copié" : "Copier le lien du NFT"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

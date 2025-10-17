import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getNFTsForProfile } from "@/api/blockchain";
import Config from "@config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SafeJson from "@/utils/jsonUtils";

export const CertificationBlockByProfile = ({ profileId, user}) => {
  const [nfts, setNfts] = useState([]);
  const [copied, setCopied] = useState<string | null>(null);

  const nftParticipants = []

  console.log('=== nftParticipants === CertificationBlock.tsx === key: 319792 ===');
  console.dir(nftParticipants, { depth: null, colors: true })
  console.log('=================================');

  useEffect(() => {
    const fetchNFTs = async () => {
      const nftsResult = await getNFTsForProfile(profileId);

      console.log('=== nftsResult === CertificationBlockByProfile.tsx === key: 855183 ===');
      console.dir(nftsResult, { depth: null, colors: true })
      console.log('=================================');

      if (nftsResult.success === false) {
        console.error("Error fetching NFTs:", nftsResult);
        return;
      }

      const mapedNfts = nftsResult.map((nft) => {
        const tokenUri = SafeJson.parse(nft.tokenuri)
        const obj ={
          tokenId:nft.tokenid,
          contract:nft.contract,
          tokenUri,
          attributes:{}
        }
        tokenUri.attributes.map((attr) => {
          
          obj.attributes[attr.trait_type] = attr.value;
          return true;
          
        }
        )
        return obj;
      })|| [];

      console.log('=== mapedNfts === CertificationBlockByProfile.tsx === key: 057738 ===');
      console.dir(mapedNfts, { depth: null, colors: true })
      console.log('=================================');

      if (mapedNfts ) {
        setNfts(mapedNfts);
      }
    };

    fetchNFTs();
  }, [profileId]);

  if (!nfts.length) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Participations certifiées</h3>
          <p className="text-gray-500">
            Ce profil ne dispose pas encore de certification.
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
  //const [usernames, participantIds, tokenIds, jsonStrings, userDetails] = nfts;

  // Transformation des données : on reconstruit un objet par NFT
  /** ------------------ cmt 439992 ------------------
  const nftList = jsonStrings
    .map((jsonStr, index) => {
      try {
        const details = JSON.parse(jsonStr);
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
  *-------------------------------------------------*/

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
      <h2 className="text-3xl font-bold mb-4">Participations certifiées</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nfts.map((nft, idx) => {
          // Calcul du nom d'affichage de l'utilisateur : prénom + nom s'ils sont renseignés, sinon le username.
          const fullName =
            user.first_name || user.last_name
              ? `${user.first_name} ${user.last_name}`.trim()
              : user.collectif_name ? user.collectif_name : user.username;
          // Construction de l'URL vers le block explorer.
          const explorerUrl = `https://optimistic.etherscan.io/token/${nft.contract}?a=${nft.tokenId}`;
          const downloadNftUrl = `${Config.API_URL}/nft/${nft.contract}/${nft.tokenId}`;

          const avatarSrc = user.avatar_url || "/default-avatar.png";

          const description = (nft.tokenUri.description.split("http")[0])||nft.tokenUri.description;
          const descriptionUrl = nft.tokenUri.description.split("http").length ? "http"+(nft.tokenUri.description.split("http")[1]):"";

          return (
            <Card key={idx} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{nft.tokenUri.name}</h3>
                <Badge variant="secondary">Certifié</Badge>
              </div>
              <div className="relative flex justify-center mb-4">
                <img 
                  src={nft.tokenUri.image} 
                  alt={`Image de ${nft.tokenUri.name}`} 
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
              <p className="text-gray-700 mb-4">{description}

              <a
                  href={`${descriptionUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {nft.tokenUri.name}
                </a>
              </p>
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
                    {nft.contract || nft.contractAddress || 'N/A'}
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
              {/** ------------------ cmt 779618 ------------------
               <div className="mt-4">
                <span className="font-semibold">Utilisateur :</span>{" "}
                <a
                  href={`${Config.ENDPOINT_URL}profile/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {fullName}
                </a>
              </div>
              *-------------------------------------------------*/}
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
                  {(copied === downloadNftUrl) ? "Lien copié" : "Copier le lien du NFT"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

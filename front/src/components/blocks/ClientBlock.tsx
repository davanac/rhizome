import { Project } from "@/types/project";
import { TeamMemberCard } from "./TeamMemberCard";
import { useEffect, useState } from "react";
import { getProfileById } from "@/api/profiles";
import { decodeHtmlEntities } from "@/utils/textUtils";

interface ClientBlockProps {
  client: string;
  testimonial?: string;
}

export const ClientBlock = ({ client }: ClientBlockProps) => {
  const [clientProfile, setClientProfile] = useState(null);

  useEffect(() => {
    const fetchClientProfile = async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(client);

      console.log('=== isUUID === ClientBlock.tsx === key: 889691 ===');
      console.dir(isUUID, { depth: null, colors: true })
      console.log('=================================');

      if (!isUUID) {
        setClientProfile({
          id: client,
          name: decodeHtmlEntities(client),
          username: client.toLowerCase().replace(/\s+/g, '-'),
          avatar: null,
          expertise: "Client",
          contributionDescription: "Client du projet",
          contribution: null,
          bio: "Client externe"
        });
        return;
      }

      const  data  = await getProfileById(client); 

      console.log('=== data === ClientBlock.tsx === key: 022886 ===');
      console.dir(client, { depth: null, colors: true })
      console.dir(data, { depth: null, colors: true })
      console.log('=================================');
      
      if (data?.id === client) {
        setClientProfile({
          id:data.id,
          name: `${decodeHtmlEntities(data.first_name)} ${decodeHtmlEntities(data.last_name)}`,
          username: data.username,
          avatar: data.avatar_url,
          expertise: "Client",
          contributionDescription: "Client du projet",
          contribution: null,
          bio: decodeHtmlEntities(data.bio || data.entreprise || data.collectif_name ||""),
        });
      }
    };

    fetchClientProfile();
  }, [client]);

  if (!clientProfile || clientProfile?.username?.trim()=="") {
    return null;
  }

  return (
    <div className="w-full">
      <TeamMemberCard
        id={clientProfile.id}
        name={clientProfile.name}
        username={clientProfile.username}
        avatar={clientProfile.avatar || ""}
        contribution={null}
        contributionDescription={clientProfile.contributionDescription}
        expertise={clientProfile.expertise}
        bio={clientProfile.bio}
      />
    </div>
  );
};
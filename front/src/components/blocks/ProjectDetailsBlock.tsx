import { ProjectMember } from "@/types/project";
import { TeamMemberCard } from "./TeamMemberCard";
import { Link2Icon } from "lucide-react";
import { LinkPreviewCard } from "./LinkPreviewCard";
import {useSession} from "@/hooks/useSession";



export const ProjectDetailsBlock = ({
  dueDate,
  links,
  author,
  participants,
  observers,
  thumbnail,
  nftImg,
  title,
  statusId,
  projectId,
  stringified,
  hash
}) => {
  const {session, currentProfile} = useSession();
  return (
    <div className="space-y-6">
      {links && links.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Link2Icon className="w-5 h-5" />
            Liens du projet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link, index) => (
              <LinkPreviewCard key={index} url={link.url} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Team Leader</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <TeamMemberCard
            profile_id={author.profile_id}
            name={author.name}
            username={author.username}
            avatar={author.avatar || ""}
            contribution={author.contribution}
            contributionDescription={author.contributionDescription}
            expertise={author.expertise}
            isSigned={author.isSigned}
            projectStatus={statusId}
            projectId={projectId}
            stringified={stringified}
            hash={hash}
          />
        </div>
      </div>

{participants && participants.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold mb-4">Contributeur(s)</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {participants.map((participant, index) => (
        <TeamMemberCard
          key={index}
          profile_id={participant.profile_id}
          name={participant.name}
          username={participant.username}
          avatar={participant.avatar || ""}
          contribution={participant.contribution}
          contributionDescription={participant.contributionDescription}
          expertise={participant.expertise}
          isSigned={participant.isSigned}
          projectStatus={statusId}
          projectId={projectId}
          stringified={stringified}
          hash={hash}
        />
      ))}
    </div>
  </div>
)}

{observers && observers.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold mb-4">Observateur(s)</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {observers.map((observer, index) => (
        <TeamMemberCard
          key={index}
          profile_id={observer.id}
          name={observer.name}
          username={observer.username}
          avatar={observer.avatar || ""}
          contribution={null}
          contributionDescription={observer.contributionDescription}
          expertise={""}
          projectStatus={statusId}
          projectId={projectId}
          stringified={stringified}
          hash={hash}
        />
      ))}
    </div>
  </div>
)}
    </div>
  );
};
/**
 * Component: ProjectCard
 * Description: Displays project information in a card format with interactive elements.
 * Shows project details, participants, and handles navigation.
 * 
 * @param {Object} props - Component properties
 * @param {Project} props.project - Project data to display
 * @returns {JSX.Element} Interactive project card component
 */
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Project } from "@/types/project";
import { generateProjectSlug } from "@/utils/slugify";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { decodeHtmlEntities } from "@/utils/textUtils";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const handleProjectClick = () => {
    const slug = generateProjectSlug(project.title, project.id);
    navigate(`/project/${slug}`);
  };

  const handleProfileClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    navigate(`/profile/${username}`);
  };

  project.author = project.author || project.team_leader;

  const allParticipants = [
    project.author,
    ...(project.participants || []),
    ...(project.contributors || []),
    ...(project.observers || []),
  ];



  // Get unique participants by filtering out duplicates based on username
  const uniqueParticipants = allParticipants.filter((participant, index, self) =>
    index === self.findIndex((p) => p.username === participant.username)
  );

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={handleProjectClick}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={project.thumbnail || project.banner_url}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          {
            /** ------------------ cmt 130661 ------------------
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {project.category}
          </Badge>
            *-------------------------------------------------*/
          }
          {project.author.collectif && (
            <Avatar
              className="h-6 w-6 border-2 border-white"
              onClick={(e) => handleProfileClick(e, project.author.username)}
            >
              <AvatarImage
                src={project.author.avatar || project.author.avatar_url || "/default-avatar.png"}
                alt={project.author.collectif}
              />
              <AvatarFallback>
                {project.author.collectif.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          {decodeHtmlEntities(project.title)}
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          {decodeHtmlEntities(project.description)}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {new Date(project.dueDate).toLocaleDateString("fr-FR")}
          </div>
          <div className="flex -space-x-2">
            {uniqueParticipants.map((participant, index) => (
              <Avatar
                key={index}
                className="h-8 w-8 border-2 border-white hover:z-10 cursor-pointer"
                onClick={(e) => handleProfileClick(e, participant.username)}
              >
                <AvatarImage
                  src={participant.avatar || participant.avatar_url || "/default-avatar.png"}
                  alt={participant.name || participant.username}
                />
                {

                  <AvatarFallback>
                    {participant.username.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>

                }
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
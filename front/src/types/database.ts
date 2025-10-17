import { Project, ProjectMember } from "./project";

export interface DatabaseProject {
  id: string;
  title: string;
  description: string;
  due_date: string;
  thumbnail: string;
  category: string;
  client: string;
  testimonial?: string;
  team_leader_profile: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string;
    expertise?: string;
  };
  team_leader_contribution?: number;
  team_leader_contribution_description?: string;
  project_participants?: Array<{
    user: {
      id: string;
      first_name: string;
      last_name: string;
      username: string;
      avatar_url?: string;
      expertise?: string;
    };
    contribution: number;
    contribution_description?: string;
    avatar?: string;
  }>;
  project_links?: Array<{
    url: string;
  }>;
}
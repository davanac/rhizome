import { SimulationNodeDatum } from 'd3';

export interface NetworkNode extends SimulationNodeDatum {
  id: string;
  name: string;
  avatar: string | null;
  value: number;
  expertise: string;
  isCollectif: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  index?: number;
  fx: number | null;
  fy: number | null;
}

export interface NetworkLink {
  source: NetworkNode | string;
  target: NetworkNode | string;
  projectId: string;
  projectTitle: string;
  collaborationCount?: number;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null; 
  username: string | null;
  avatar_url: string | null;
  expertise: string | null;
  account_type: string | null;
}

export interface Project {
  id: string;
  title: string;
  team_leader: string;
  client: string | null;
  team_leader_profile: Profile;
  client_profile?: Profile;
  project_participants?: Array<{
    user: Profile;
  }>;
}
/**
 * Project Data Transformation Utilities
 * Description: Transforms database models to application models.
 * 
 * Technical choices:
 * - Type safety: TypeScript interfaces for both input and output models
 * - Data normalization: Consistent format for frontend consumption
 * - Null handling: Safe defaults for optional fields
 */
import { DatabaseProject } from "@/types/database"; // Database model type
import { Project, ProjectLink } from "@/types/project"; // Application model types
import { url } from "inspector";

/**
 * Transforms a database project record into the application's project model.
 * Handles nested relationships and provides consistent data structure.
 * 
 * @param {DatabaseProject} project - Raw project data from database
 * @returns {Project} Transformed project data for frontend use
 */
export const transformDatabaseProject = (project) => {
  // Transform project links to frontend format
  const links = project.project_links?.map(link => ({
    url: link.url
  })) || [];

  
  
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    dueDate: project.due_date,
    thumbnail: project.banner_url,
    category: project.category||"",
    client: project.client||"",
    testimonial: project.testimonial,
    stringified: project.stringified||"",
    hash: project.hash||"",
    url: project.url||"",
    nftImg: project.nft_img||"",
    statusId: project.status_id||"",
    status: project.status||"unknown status",
    // Transform author (team leader) data
    author: {
      id: project.team_leader.id,
      profile_id: project.team_leader.profile_id,
      name: `${project.team_leader?.first_name||""} ${project.team_leader?.last_name||""}`,
      username: project.team_leader.username,
      avatar: project.team_leader.avatar_url,
      expertise: project.team_leader.expertise||"",
      role: "Team Leader",
      contribution: project.team_leader.contribution || 0,
      contributionDescription: project.team_leader.contribution_description||"",
      isSigned: project.team_leader.is_signed||null,
      signature: project.team_leader.signature||null
    },
    // Transform participants data
    participants: project.contributors?.map(participant => ({
      id: participant.id,
      profile_id: participant.profile_id,
      name: `${participant.first_name||""} ${participant.last_name||""} ${participant.collectif_name||""}`,
      username: participant.username,
      avatar: participant.avatar || participant.avatar_url,
      expertise: participant.expertise||"",
      role: "Member" as const,
      contribution: participant.contribution||"",
      contributionDescription: participant.contribution_description||" ",
      isSigned: participant.is_signed||null,
      signature: participant.signature||null
    })) || [],
    // Transform participants data
    observers: project.observers?.map(participant => ({
      id: participant.id,
      profile_id: participant.profile_id,
      name: `${participant.first_name} ${participant.last_name} ${participant.collectif_name||""}`,
      username: participant.username,
      avatar: participant.avatar || participant.avatar_url,
      expertise: participant.expertise||"",
      role: "Member" as const,
      contribution: 0,
      contributionDescription: ""
    })) || [],
    links
  };
};
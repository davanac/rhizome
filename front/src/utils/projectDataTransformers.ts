import { transformDatabaseProject } from "./projectTransformers";

export const transformProjectData = (project) => ({
  ...project,
  author: {
    ...project.team_leader,
    role: "Team Leader",
    contribution: project.team_leader_contribution||9999,
    contributionDescription: project.team_leader_contribution_description||"",
    isSigned: project.is_signed||null,
    signature: project.signature||null
  },
  participants: project.contributors?.map((p) => ({
    name: `${p.first_name} ${p.last_name}`,
    username: p.username,
    avatar: p.avatar || p.avatar_url,
    expertise: p.expertise||"647778",
    role: "Member",
    contribution: p.contribution||389917,
    contributionDescription: p.contribution_description||"",
    isSigned: p.is_signed||null,
    signature: p.signature||null
  })) || []
});

export const transformAndDeduplicateProjects = (projects) => {

  const step1 = projects.map(transformProjectData);


  
  const step2 = step1.map(transformDatabaseProject);



  return projects
    .map(transformProjectData)
    .map(transformDatabaseProject)
    .filter(
      (project, index, self) =>
        index === self.findIndex((p) => p.id === project.id)
    );
};
import type { NetworkData, NetworkDependencies } from "./types/network.types";
import type { NetworkNode, NetworkLink, Profile, Project } from "@/types/networkTypes";

/**
 * NetworkService - Encapsulates network graph business logic
 * Handles transformation of project and profile data into D3.js network visualization format
 */
export class NetworkService {
  constructor(private dependencies: NetworkDependencies) {}

  /**
   * Transform a profile into a network node
   * @param profile - Profile to transform
   * @returns NetworkNode for visualization
   */
  transformProfileToNode(profile: Profile): NetworkNode {
    const isCollectif = profile.account_type === 'collectif';
    const name = isCollectif 
      ? profile["collectif-name"] || ''
      : `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

    return {
      id: profile.id,
      name,
      avatar: profile.avatar_url,
      expertise: profile.expertise || 'Non spécifié',
      value: 1,
      isCollectif,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      index: 0,
      fx: null,
      fy: null
    };
  }

  /**
   * Create network links between project members
   * @param project - Project containing team members
   * @param links - Existing links array to append to
   */
  createNetworkLinks(project: Project, links: NetworkLink[]): void {
    const participants = project.project_participants?.map(p => p.user.id) || [];
    const allMembers = [project.team_leader_profile.id, ...participants];
    
    console.log('Creating network links for project:', project.id);

    // Create links between all project members
    for (let i = 0; i < allMembers.length; i++) {
      for (let j = i + 1; j < allMembers.length; j++) {
        links.push({
          source: allMembers[i],
          target: allMembers[j],
          projectId: project.id,
          projectTitle: project.title
        });
      }
    }

    // Add link between team leader and client if exists
    if (project.client_profile) {
      links.push({
        source: project.team_leader_profile.id,
        target: project.client_profile.id,
        projectId: project.id,
        projectTitle: project.title
      });

      // Add links between participants and client
      participants.forEach(participantId => {
        links.push({
          source: participantId,
          target: project.client_profile.id,
          projectId: project.id,
          projectTitle: project.title
        });
      });
    }
  }

  /**
   * Count and aggregate collaborations between nodes
   * @param links - Array of network links to process
   * @returns Array of network links with added collaboration counts
   */
  private countCollaborations(links: NetworkLink[]): NetworkLink[] {
    const collaborationMap = new Map<string, number>();

    links.forEach((link) => {
      const key = [link.source, link.target].sort().join("-");
      collaborationMap.set(key, (collaborationMap.get(key) || 0) + 1);
    });

    return links.map((link) => {
      const key = [link.source, link.target].sort().join("-");
      return {
        ...link,
        collaborationCount: collaborationMap.get(key) || 1,
      };
    });
  }

  /**
   * Remove duplicate links from the network
   * @param links - Array of network links
   * @returns Array of unique links
   */
  private deduplicateLinks(links: NetworkLink[]): NetworkLink[] {
    const uniqueLinks = [];
    const seen = new Set();

    for (const link of links) {
      // Create an ordered key, same for (A, B) and (B, A)
      const [a, b] = [link.source, link.target].sort();
      const key = `${a}|${b}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueLinks.push(link);
      }
    }

    return uniqueLinks;
  }

  /**
   * Process projects into network visualization data
   * @returns NetworkData with nodes and links
   */
  async processNetworkData(): Promise<NetworkData> {
    const { networkApi } = this.dependencies;

    try {
      const { projects, error } = await networkApi.getNetwork();

      if (error) {
        throw new Error('Failed to fetch network data');
      }

      const nodes = new Map<string, NetworkNode>();
      const links: NetworkLink[] = [];

      projects?.forEach((project) => {
        // Add team leader to nodes
        if (project.team_leader) {
          project.team_leader_profile = project.team_leader;
          project.team_leader = project.team_leader_profile.id;

          const node = this.transformProfileToNode(
            project.team_leader_profile as unknown as Profile
          );
          
          if (nodes.has(node.id)) {
            const existingNode = nodes.get(node.id)!;
            nodes.set(node.id, {
              ...existingNode,
              value: existingNode.value + 1,
            });
          } else {
            nodes.set(node.id, node);
          }
        }

        // Add observers to nodes
        project.observers?.forEach((observer) => {
          const node = this.transformProfileToNode(observer as unknown as Profile);
          if (nodes.has(node.id)) {
            const existingNode = nodes.get(node.id)!;
            nodes.set(node.id, {
              ...existingNode,
              value: existingNode.value + 1,
            });
          } else {
            nodes.set(node.id, node);
          }
        });

        // Add contributors to nodes and create links
        project.contributors?.forEach((user) => {
          if (!user) return;

          const node = this.transformProfileToNode(user as unknown as Profile);
          if (nodes.has(node.id)) {
            const existingNode = nodes.get(node.id)!;
            nodes.set(node.id, {
              ...existingNode,
              value: existingNode.value + 1,
            });
          } else {
            nodes.set(node.id, node);
          }

          // Create links between contributors
          if (project.contributors?.length) {
            project.contributors?.forEach((contrib) => {
              links.push({
                source: node.id,
                target: (contrib as unknown as Profile).id,
                projectId: project.id,
                projectTitle: project.title,
              });
            });
          }

          // Create links between contributors and observers
          if (project.observers?.length) {
            project.observers?.forEach((observer) => {
              links.push({
                source: node.id,
                target: (observer as unknown as Profile).id,
                projectId: project.id,
                projectTitle: project.title,
              });
            });
          }

          // Create link between contributor and team leader
          if (project.team_leader_profile) {
            links.push({
              source: node.id,
              target: (project.team_leader_profile as unknown as Profile).id,
              projectId: project.id,
              projectTitle: project.title,
            });
          }
        });

        // Create link between team leader and observers
        if (project.observers?.length && project.team_leader_profile) {
          project.observers?.forEach((observer) => {
            links.push({
              source: (project.team_leader_profile as unknown as Profile).id,
              target: (observer as unknown as Profile).id,
              projectId: project.id,
              projectTitle: project.title,
            });
          });
        }
      });

      // Deduplicate and process links
      const uniqueLinks = this.deduplicateLinks(links);
      const processedLinks = this.countCollaborations(uniqueLinks);

      // Final deduplication to remove bidirectional duplicates
      const finalLinks = processedLinks.filter(
        (link, index, self) =>
          index ===
          self.findIndex(
            (l) =>
              (l.source === link.source && l.target === link.target) ||
              (l.source === link.target && l.target === link.source)
          )
      );

      return {
        nodes: Array.from(nodes.values()),
        links: finalLinks,
      };

    } catch (error) {
      console.error('Error processing network data:', error);
      throw error;
    }
  }
}
import type { NetworkNode, NetworkLink, Profile, Project } from "@/types/networkTypes";

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface NetworkDependencies {
  networkApi: any;
}
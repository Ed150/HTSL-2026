export type UserProfile = {
  skills: string[];
  interests: string[];
  desired_careers: string[];
  desired_opportunities: string[];
  desired_skills: string[];
};

export type NodeType =
  | "interest"
  | "skill"
  | "opportunity"
  | "experience"
  | "course"
  | "professor"
  | "lab"
  | "project"
  | "career"
  | "job"
  | "skill_milestone";

export type PositionedNode = {
  id: string;
  title: string;
  type: NodeType;
  short_summary: string;
  detailed_summary: string;
  skills_gained: string[];
  why_it_matters: string;
  logical_next_step: string;
  links: string[];
  confidence: number;
  end_cap: boolean;
  x: number;
  y: number;
  depth: number;
  visited: boolean;
  active: boolean;
  parent_id: string | null;
  path_ids: string[];
};

export type EdgePayload = {
  id: string;
  source: string;
  target: string;
  label: string;
  branch_index: number;
};

export type PathRecord = {
  id: string;
  name: string;
  profile: UserProfile;
  nodes: PositionedNode[];
  edges: EdgePayload[];
  active_node_id: string;
  breadcrumbs: string[];
  summary_ready: boolean;
};

export type SummaryResponse = {
  title: string;
  overview: string;
  steps: { title: string; type: string; summary: string; skills_gained: string[]; why: string }[];
  actionables: string[];
  recommendation: string;
};

export type DetailResponse = {
  node: PositionedNode;
  fit_with_path: string;
  unlocks_next: string[];
};

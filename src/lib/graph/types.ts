export type NodeType =
  | "activity"
  | "emotion"
  | "person"
  | "concept"
  | "anxiety"
  | "achievement"
  | "place";

export const NODE_COLORS: Record<NodeType | "you", string> = {
  activity: "#3b82f6",
  emotion: "#a855f7",
  person: "#22c55e",
  concept: "#f97316",
  anxiety: "#ef4444",
  achievement: "#eab308",
  place: "#ec4899",
  you: "#e0e7ff",
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  activity: "Activity",
  emotion: "Emotion",
  person: "Person",
  concept: "Concept",
  anxiety: "Anxiety",
  achievement: "Achievement",
  place: "Place",
};

export interface GraphNode {
  id: string;
  user_id?: string;
  label: string;
  type: NodeType;
  weight: number;
  notes?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  created_at?: string;
  // D3 simulation properties (added at runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface GraphEdge {
  id: string;
  user_id?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  source_id?: string;
  target_id?: string;
  strength: number;
  created_at?: string;
  index?: number;
}

export interface GraphCluster {
  id: string;
  label: string;
  node_ids: string[];
  color: string;
}

export interface FilterState {
  types: NodeType[];
  dateRange: [string, string] | null;
}

import { DetailResponse, PathRecord, SummaryResponse, UserProfile } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8001/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export const api = {
  initPath(profile: UserProfile) {
    return post<{ path: PathRecord }>("/paths/init", { profile });
  },
  expandPath(path: PathRecord, fromNodeId: string, selectedNodeId: string) {
    return post<{ path: PathRecord; prompt: string }>("/paths/expand", {
      path,
      from_node_id: fromNodeId,
      selected_node_id: selectedNodeId
    });
  },
  summarizePath(path: PathRecord) {
    return post<SummaryResponse>("/paths/summary", { path });
  },
  nodeDetail(path: PathRecord, nodeId: string) {
    return post<DetailResponse>("/paths/node-detail", {
      path,
      from_node_id: nodeId,
      selected_node_id: nodeId
    });
  }
};

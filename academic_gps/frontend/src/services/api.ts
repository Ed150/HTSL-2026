import { CalendarPlanResponse, DiscoverRequest, DiscoverResponse, MapResponse } from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000/api";

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
  discover(payload: DiscoverRequest) {
    return post<DiscoverResponse>("/discover", payload);
  },
  buildMap(payload: DiscoverRequest) {
    return post<MapResponse>("/map", payload);
  },
  suggestPlan(payload: { discovery: DiscoverRequest; days: number }) {
    return post<CalendarPlanResponse>("/planner/suggest", payload);
  }
};

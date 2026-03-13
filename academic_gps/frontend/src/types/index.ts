export type DiscoverRequest = {
  interests: string;
  skills: string[];
  goals: string;
  program?: string;
  year?: string;
  industries: string[];
  availability_preferences?: string;
};

export type Recommendation = {
  id: string;
  name: string;
  type: string;
  short_description: string;
  relevance_score: number;
  explanation: string;
  tags: string[];
};

export type ActionItem = {
  id: string;
  title: string;
  type: string;
  estimated_minutes: number;
  priority: string;
  why_it_matters: string;
  suggested_schedule_window: string;
  urgency: number;
  value_score: number;
  deadline_window: string;
  related_entity_ids: string[];
};

export type DiscoverResponse = {
  parsed_intent: Record<string, unknown>;
  summary: string;
  professors: Recommendation[];
  labs: Recommendation[];
  alumni: Recommendation[];
  courses: Recommendation[];
  events: Recommendation[];
  opportunities: Recommendation[];
  suggested_next_steps: ActionItem[];
  suggested_calendar_actions: ActionItem[];
  pathway: {
    headline: string;
    narration: string;
    immediate_next_steps: string[];
    short_term_actions: string[];
    medium_term_path: string[];
    stages: { title: string; summary: string; related_ids: string[] }[];
  };
  weekly_plan_preview: string[];
};

export type MapResponse = {
  title: string;
  subtitle: string;
  nodes: { id: string; label: string; type: string; size: number; color: string; detail: string; highlighted: boolean }[];
  edges: { source: string; target: string; label: string; weight: number; highlighted: boolean }[];
  highlighted_path: string[];
  export_path: string;
};

export type CalendarPlanResponse = {
  scheduled_actions: { action_id: string; title: string; start: string; end: string; rationale: string }[];
  unscheduled_actions: ActionItem[];
  free_slots: { start: string; end: string; score: number; note: string }[];
  summary: string;
};

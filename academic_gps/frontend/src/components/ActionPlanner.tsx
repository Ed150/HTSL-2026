import { CalendarPlanResponse, DiscoverResponse } from "../types";

type Props = {
  result: DiscoverResponse;
  plan: CalendarPlanResponse | null;
  onPlan: () => Promise<void>;
  isLoading: boolean;
};

export function ActionPlanner({ result, plan, onPlan, isLoading }: Props) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Calendar Planner</p>
          <h2>Google Calendar aware weekly plan</h2>
        </div>
        <button className="primary" onClick={onPlan} disabled={isLoading}>
          {isLoading ? "Planning..." : "Generate Weekly Plan"}
        </button>
      </div>
      <div className="planner-layout">
        <div>
          <h3>Suggested actions</h3>
          {result.suggested_calendar_actions.slice(0, 6).map((action) => (
            <article className="planner-card" key={action.id}>
              <div className="badge-row">
                <span className="badge">{action.type}</span>
                <span className="score">{action.estimated_minutes} min</span>
              </div>
              <h4>{action.title}</h4>
              <p>{action.why_it_matters}</p>
              <p className="muted">{action.suggested_schedule_window}</p>
            </article>
          ))}
        </div>
        <div>
          <h3>Planner output</h3>
          {!plan && <p className="muted">Use demo mode or connect Google Calendar on a live build to slot actions into real free time.</p>}
          {plan && (
            <>
              <p>{plan.summary}</p>
              {plan.scheduled_actions.map((item) => (
                <article className="planner-card" key={item.action_id}>
                  <h4>{item.title}</h4>
                  <p>{new Date(item.start).toLocaleString()} to {new Date(item.end).toLocaleTimeString()}</p>
                  <p className="muted">{item.rationale}</p>
                </article>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

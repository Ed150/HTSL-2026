import { useState } from "react";
import { ActionPlanner } from "../components/ActionPlanner";
import { InterestForm } from "../components/InterestForm";
import { MapPanel } from "../components/MapPanel";
import { PathwayPanel } from "../components/PathwayPanel";
import { RecommendationSection } from "../components/RecommendationSection";
import { api } from "../services/api";
import { CalendarPlanResponse, DiscoverRequest, DiscoverResponse, MapResponse } from "../types";

export function App() {
  const [result, setResult] = useState<DiscoverResponse | null>(null);
  const [map, setMap] = useState<MapResponse | null>(null);
  const [plan, setPlan] = useState<CalendarPlanResponse | null>(null);
  const [request, setRequest] = useState<DiscoverRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: DiscoverRequest) => {
    setIsLoading(true);
    setError(null);
    setPlan(null);
    try {
      const [discoverResult, mapResult] = await Promise.all([api.discover(payload), api.buildMap(payload)]);
      setRequest(payload);
      setResult(discoverResult);
      setMap(mapResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlan = async () => {
    if (!request) return;
    setIsPlanning(true);
    setError(null);
    try {
      const nextPlan = await api.suggestPlan({ discovery: request, days: 14 });
      setPlan(nextPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Planner failed.");
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div>
          <p className="eyebrow">Hackathon MVP</p>
          <h2>Academic GPS</h2>
        </div>
        <div className="pill-row">
          <span className="pill">Bedrock-aware</span>
          <span className="pill">Graph-driven</span>
          <span className="pill">Calendar-aware</span>
        </div>
      </nav>

      <InterestForm onSubmit={handleSubmit} isLoading={isLoading} />

      {error && <section className="panel error-panel">{error}</section>}

      {result && (
        <>
          <section className="panel summary-panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Results Dashboard</p>
                <h2>Personalized recommendation bundle</h2>
              </div>
              <p className="muted max-width">{result.summary}</p>
            </div>
            <div className="triptych">
              {result.weekly_plan_preview.map((item) => (
                <div key={item} className="mini-stat">
                  <h3>Weekly plan</h3>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <PathwayPanel result={result} />
          <MapPanel map={map} />
          <ActionPlanner result={result} plan={plan} onPlan={handlePlan} isLoading={isPlanning} />

          <RecommendationSection title="Best-fit Professors" items={result.professors} />
          <RecommendationSection title="Best-fit Labs and Groups" items={result.labs} />
          <RecommendationSection title="Best-fit Alumni" items={result.alumni} />
          <RecommendationSection title="Courses" items={result.courses} />
          <RecommendationSection title="Events and Opportunities" items={[...result.events, ...result.opportunities]} />
        </>
      )}
    </main>
  );
}

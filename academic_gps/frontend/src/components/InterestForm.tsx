import { useState } from "react";
import { DiscoverRequest } from "../types";

type Props = {
  onSubmit: (payload: DiscoverRequest) => Promise<void>;
  isLoading: boolean;
};

const demoPayload: DiscoverRequest = {
  interests: "I'm interested in quantum computing and photonics.",
  skills: ["Python", "linear algebra", "physics"],
  goals: "research career",
  program: "Engineering Science",
  year: "3",
  industries: ["quantum", "photonics"],
  availability_preferences: "weekday evenings and Friday afternoons"
};

export function InterestForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<DiscoverRequest>(demoPayload);

  const update = (key: keyof DiscoverRequest, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="panel hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Academic GPS</p>
        <h1>Your academic pathway, operationalized.</h1>
        <p className="lede">
          Describe your interests in plain language. Academic GPS turns them into professors, labs,
          alumni, opportunities, a visual pathway map, and a calendar-aware action plan.
        </p>
      </div>
      <div className="form-grid">
        <label>
          Interests
          <textarea value={form.interests} onChange={(event) => update("interests", event.target.value)} rows={4} />
        </label>
        <label>
          Goals
          <input value={form.goals} onChange={(event) => update("goals", event.target.value)} />
        </label>
        <label>
          Skills
          <input
            value={form.skills.join(", ")}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                skills: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
              }))
            }
          />
        </label>
        <label>
          Industries
          <input
            value={form.industries.join(", ")}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                industries: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
              }))
            }
          />
        </label>
        <label>
          Program
          <input value={form.program || ""} onChange={(event) => update("program", event.target.value)} />
        </label>
        <label>
          Year
          <input value={form.year || ""} onChange={(event) => update("year", event.target.value)} />
        </label>
        <label className="full-width">
          Availability preferences
          <input
            value={form.availability_preferences || ""}
            onChange={(event) => update("availability_preferences", event.target.value)}
          />
        </label>
        <div className="button-row full-width">
          <button className="primary" onClick={() => onSubmit(form)} disabled={isLoading}>
            {isLoading ? "Building pathway..." : "Generate Academic GPS"}
          </button>
          <button className="secondary" onClick={() => onSubmit(demoPayload)} disabled={isLoading}>
            Load Demo Mode
          </button>
        </div>
      </div>
    </section>
  );
}

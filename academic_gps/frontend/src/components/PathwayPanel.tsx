import { DiscoverResponse } from "../types";

type Props = {
  result: DiscoverResponse;
};

export function PathwayPanel({ result }: Props) {
  return (
    <section className="panel pathway-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Pathway Engine</p>
          <h2>{result.pathway.headline}</h2>
        </div>
        <p className="muted max-width">{result.pathway.narration}</p>
      </div>
      <div className="timeline">
        {result.pathway.stages.map((stage) => (
          <div className="timeline-item" key={stage.title}>
            <div className="timeline-dot" />
            <div>
              <h3>{stage.title}</h3>
              <p>{stage.summary}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="triptych">
        <div>
          <h3>Immediate next steps</h3>
          {result.pathway.immediate_next_steps.map((step) => <p key={step}>{step}</p>)}
        </div>
        <div>
          <h3>This month</h3>
          {result.pathway.short_term_actions.map((step) => <p key={step}>{step}</p>)}
        </div>
        <div>
          <h3>Medium-term arc</h3>
          {result.pathway.medium_term_path.map((step) => <p key={step}>{step}</p>)}
        </div>
      </div>
    </section>
  );
}

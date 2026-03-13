import { Recommendation } from "../types";

type Props = {
  title: string;
  items: Recommendation[];
};

export function RecommendationSection({ title, items }: Props) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>{title}</h2>
        <span>{items.length} matches</span>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <article className="info-card" key={item.id}>
            <div className="badge-row">
              <span className="badge">{item.type}</span>
              <span className="score">{Math.round(item.relevance_score * 100)}%</span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.short_description}</p>
            <p className="muted">{item.explanation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

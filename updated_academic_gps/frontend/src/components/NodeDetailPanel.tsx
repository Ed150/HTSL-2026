import { DetailResponse } from "../types";

type Props = {
  detail: DetailResponse | null;
};

export function NodeDetailPanel({ detail }: Props) {
  if (!detail) {
    return (
      <div className="glass flex h-full min-h-0 flex-col rounded-[24px] border border-ficus-cream/10 bg-ficus-plum/20 p-4 text-sm text-ficus-lilac">
        <div className="shrink-0">Single-click a bubble to inspect why it fits your UofT context, what skills it builds, and what it opens next.</div>
      </div>
    );
  }

  return (
    <div className="glass flex h-full min-h-0 flex-col rounded-[24px] border border-ficus-cream/10 bg-ficus-plum/20">
      <div className="shrink-0 border-b border-ficus-cream/10 px-4 pb-3 pt-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ficus-lilac">{detail.node.type}</p>
        <h3 className="mt-1 text-xl font-semibold text-ficus-cream">{detail.node.title}</h3>
        <p className="mt-2 text-xs text-ficus-lilac">
          {detail.node.source}
          {detail.node.campus ? ` | ${detail.node.campus}` : ""}
          {detail.node.faculty ? ` | ${detail.node.faculty}` : ""}
        </p>
      </div>
      <div className="scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <p className="text-sm leading-6 text-ficus-lilac">{detail.node.detailed_summary}</p>
        {detail.node.source_url && (
          <a
            href={detail.node.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full border border-ficus-coral/20 bg-ficus-coral/10 px-3 py-1.5 text-xs text-ficus-cream transition hover:bg-ficus-coral/20"
          >
            Open source page
          </a>
        )}
        <div className="mt-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ficus-lilac">Skills gained</p>
          <div className="flex flex-wrap gap-2">
            {detail.node.skills_gained.map((skill) => (
              <span key={skill} className="rounded-full bg-ficus-forest/30 px-3 py-1 text-xs text-ficus-cream">{skill}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm text-ficus-lilac">
          <p>{detail.fit_with_path}</p>
          <p>{detail.campus_relevance}</p>
          <p>{detail.node.logical_next_step}</p>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-ficus-cream/10 bg-ficus-forest/20 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ficus-lilac">Eligibility</p>
            <p className="text-sm text-ficus-lilac">{detail.node.eligibility || "No special restrictions surfaced in demo mode."}</p>
          </div>
          <div className="rounded-2xl border border-ficus-cream/10 bg-ficus-forest/20 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ficus-lilac">Quick actions</p>
            <div className="space-y-2">
              {detail.quick_actions.map((item) => (
                <div key={item} className="rounded-2xl bg-ficus-plum/30 px-3 py-2 text-sm text-ficus-cream">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        {detail.unlocks_next.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ficus-lilac">Unlocks next</p>
            <div className="space-y-2">
              {detail.unlocks_next.map((item) => (
                <div key={item} className="rounded-2xl border border-ficus-cream/10 bg-ficus-plum/30 px-3 py-2 text-sm text-ficus-cream">{item}</div>
              ))}
            </div>
          </div>
        )}
        {(detail.node.related_roles.length > 0 || detail.node.related_skills.length > 0) && (
          <div className="mt-4 grid gap-3">
            {detail.node.related_roles.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ficus-lilac">Related roles</p>
                <div className="flex flex-wrap gap-2">
                  {detail.node.related_roles.map((item) => (
                    <span key={item} className="rounded-full bg-ficus-forest/30 px-3 py-1 text-xs text-ficus-cream">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {detail.node.related_skills.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ficus-lilac">Related skills</p>
                <div className="flex flex-wrap gap-2">
                  {detail.node.related_skills.map((item) => (
                    <span key={item} className="rounded-full bg-ficus-forest/30 px-3 py-1 text-xs text-ficus-cream">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { DetailResponse } from "../types";

type Props = {
  detail: DetailResponse | null;
};

export function NodeDetailPanel({ detail }: Props) {
  if (!detail) {
    return (
      <div className="glass flex h-full min-h-0 flex-col rounded-[24px] border border-white/12 bg-white/[0.06] p-4 text-sm text-slate-300">
        <div className="shrink-0">Select a node tab to inspect why it matters, what it builds, and what it unlocks next.</div>
      </div>
    );
  }

  return (
    <div className="glass flex h-full min-h-0 flex-col rounded-[24px] border border-white/12 bg-white/[0.06]">
      <div className="shrink-0 border-b border-white/8 px-4 pb-3 pt-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{detail.node.type}</p>
        <h3 className="mt-1 text-xl font-semibold text-white">{detail.node.title}</h3>
      </div>
      <div className="scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <p className="text-sm leading-6 text-slate-300">{detail.node.detailed_summary}</p>
        <div className="mt-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">Skills gained</p>
          <div className="flex flex-wrap gap-2">
            {detail.node.skills_gained.map((skill) => (
              <span key={skill} className="rounded-full bg-white/12 px-3 py-1 text-xs text-slate-100">{skill}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p>{detail.fit_with_path}</p>
          <p>{detail.node.logical_next_step}</p>
        </div>
        {detail.unlocks_next.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">Unlocks next</p>
            <div className="space-y-2">
              {detail.unlocks_next.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 text-sm text-slate-100">{item}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

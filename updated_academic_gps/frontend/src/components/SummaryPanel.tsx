import { X } from "lucide-react";
import { SummaryResponse } from "../types";

type Props = {
  summary: SummaryResponse | null;
  open: boolean;
  onClose: () => void;
};

export function SummaryPanel({ summary, open, onClose }: Props) {
  if (!open || !summary) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
      <div className="glass max-h-[84vh] w-full max-w-3xl overflow-auto rounded-[28px] p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Path summary</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{summary.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{summary.overview}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/8">
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.35fr,0.85fr]">
          <div className="space-y-3">
            {summary.steps.map((step) => (
              <div key={step.title} className="rounded-2xl bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-white">{step.title}</h3>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{step.type}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.summary}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{step.why}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.skills_gained.map((skill) => (
                    <span key={skill} className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-200">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Actionables</p>
              <div className="mt-3 space-y-2">
                {summary.actionables.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-400/12 via-indigo-400/10 to-fuchsia-400/12 p-4 text-sm leading-6 text-slate-200">
              {summary.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

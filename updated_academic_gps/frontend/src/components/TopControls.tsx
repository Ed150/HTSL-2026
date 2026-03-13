import { RotateCcw, Search, Sparkles } from "lucide-react";

type Props = {
  zoom: number;
  onZoom: (next: number) => void;
  onResetView: () => void;
  onSummarize: () => void;
  canSummarize: boolean;
};

export function TopControls({ zoom, onZoom, onResetView, onSummarize, canSummarize }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onZoom(Math.max(0.5, zoom - 0.1))} className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/8">
        <Search size={14} className="mr-1 inline-block" />-
      </button>
      <button onClick={() => onZoom(Math.min(1.45, zoom + 0.1))} className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/8">
        <Search size={14} className="mr-1 inline-block" />+
      </button>
      <button onClick={onResetView} className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/8">
        <RotateCcw size={14} className="mr-1 inline-block" />Reset
      </button>
      <button
        onClick={onSummarize}
        disabled={!canSummarize}
        className="rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 px-4 py-2 text-xs font-medium text-slate-950 disabled:opacity-50"
      >
        <Sparkles size={14} className="mr-1 inline-block" />Summarize
      </button>
    </div>
  );
}

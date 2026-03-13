import { Plus, Trash2 } from "lucide-react";
import { PathRecord } from "../types";

type Props = {
  paths: PathRecord[];
  activePathId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function SavedPathsSidebar({ paths, activePathId, onSelect, onNew, onDelete }: Props) {
  return (
    <aside className="glass flex h-full w-[220px] flex-col rounded-[24px] p-3">
      <div className="mb-3 flex items-center justify-between px-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Paths</p>
          <h2 className="text-sm font-medium text-white">Saved pathways</h2>
        </div>
        <button onClick={onNew} className="rounded-full border border-white/12 bg-white/[0.08] p-2 text-slate-100 hover:bg-white/[0.12]">
          <Plus size={14} />
        </button>
      </div>
      <div className="scrollbar flex-1 space-y-2 overflow-auto pr-1">
        {paths.map((path) => (
          <button
            key={path.id}
            onClick={() => onSelect(path.id)}
            className={`w-full rounded-2xl px-3 py-3 text-left transition ${
              path.id === activePathId ? "bg-white/14 text-white shadow-glow ring-1 ring-sky-300/20" : "bg-white/[0.08] text-slate-200 hover:bg-white/[0.12]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{path.name}</div>
                <div className="mt-1 truncate text-xs text-slate-300/80">{path.breadcrumbs[path.breadcrumbs.length - 1]}</div>
              </div>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(path.id);
                }}
                className="rounded-full p-1 text-slate-300/70 hover:bg-white/10 hover:text-white"
              >
                <Trash2 size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

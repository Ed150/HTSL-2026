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
      <div className="mb-6 flex items-center gap-3 px-2">
        <img 
          src="/648223734_1219376380348981_176398887528869947_n.png" 
          alt="Ficus Logo" 
          className="h-8 w-8 rounded-lg object-contain"
        />
        <h1 className="text-lg font-bold tracking-tight text-ficus-cream">Ficus</h1>
      </div>
      <div className="mb-3 flex items-center justify-between px-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-ficus-lilac">Paths</p>
          <h2 className="text-sm font-medium text-ficus-cream">Saved pathways</h2>
        </div>
        <button onClick={onNew} className="rounded-full border border-ficus-cream/10 bg-ficus-forest/20 p-2 text-ficus-cream hover:bg-ficus-forest/30">
          <Plus size={14} />
        </button>
      </div>
      <div className="scrollbar flex-1 space-y-2 overflow-auto pr-1">
        {paths.map((path) => (
          <button
            key={path.id}
            onClick={() => onSelect(path.id)}
            className={`w-full rounded-2xl px-3 py-3 text-left transition ${
              path.id === activePathId ? "bg-ficus-plum/40 text-ficus-cream shadow-glow ring-1 ring-ficus-coral/40" : "bg-ficus-forest/20 text-ficus-cream/90 hover:bg-ficus-forest/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{path.name}</div>
                <div className="mt-1 truncate text-xs text-ficus-lilac/80">{path.breadcrumbs[path.breadcrumbs.length - 1]}</div>
              </div>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(path.id);
                }}
                className="rounded-full p-1 text-ficus-lilac/70 hover:bg-ficus-plum/30 hover:text-ficus-cream"
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

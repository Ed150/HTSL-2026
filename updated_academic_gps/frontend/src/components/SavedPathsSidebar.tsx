import { BrandMark } from "./BrandMark";
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
      <div className="mb-6 flex px-2">
        <BrandMark compact />
      </div>
      <div className="mb-3 flex items-center justify-between px-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#dcc4aa]">Paths</p>
          <h2 className="text-sm font-medium text-[#f7ead8]">Saved pathways</h2>
        </div>
        <button onClick={onNew} className="rounded-full border border-[#e8d7c2]/28 bg-[rgba(248,235,219,0.12)] p-2 text-[#f7ead8] hover:bg-[rgba(248,235,219,0.2)]">
          <Plus size={14} />
        </button>
      </div>
      <div className="scrollbar flex-1 space-y-2 overflow-auto pr-1">
        {paths.map((path) => (
          <button
            key={path.id}
            onClick={() => onSelect(path.id)}
            className={`w-full rounded-2xl px-3 py-3 text-left transition ${
              path.id === activePathId
                ? "bg-[rgba(232,214,195,0.16)] text-[#f7ead8] shadow-glow ring-1 ring-[#dfbea0]/55"
                : "bg-[rgba(248,235,219,0.08)] text-[#f2e2cf] hover:bg-[rgba(248,235,219,0.14)]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{path.name}</div>
                <div className="mt-1 truncate text-xs text-[#d2b89b]">{path.breadcrumbs[path.breadcrumbs.length - 1]}</div>
              </div>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(path.id);
                }}
                className="rounded-full p-1 text-[#d2b89b] hover:bg-[rgba(248,235,219,0.14)] hover:text-[#f7ead8]"
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

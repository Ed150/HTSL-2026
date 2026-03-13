import { X } from "lucide-react";
import { DetailResponse } from "../types";

type Props = {
  tabs: DetailResponse[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
};

export function OpenedNodeTabs({ tabs, activeTabId, onSelect, onClose }: Props) {
  return (
    <aside className="glass flex h-full w-[260px] flex-col rounded-[24px] p-3">
      <div className="mb-3 px-2">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ficus-lilac">Node docs</p>
        <h2 className="text-sm font-medium text-ficus-cream">Opened details</h2>
      </div>
      <div className="scrollbar flex-1 space-y-2 overflow-auto pr-1">
        {tabs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ficus-cream/10 bg-ficus-forest/10 px-3 py-4 text-xs leading-5 text-ficus-lilac">
            Single-click any bubble to open a richer UofT opportunity page here.
          </div>
        )}
        {tabs.map((tab) => (
          <div
            key={tab.node.id}
            className={`rounded-2xl border px-3 py-3 ${
              tab.node.id === activeTabId ? "border-ficus-coral/40 bg-ficus-plum/30" : "border-ficus-cream/10 bg-ficus-forest/20"
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <button onClick={() => onSelect(tab.node.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium text-ficus-cream">{tab.node.title}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ficus-lilac">{tab.node.type}</div>
              </button>
              <button onClick={() => onClose(tab.node.id)} className="rounded-full p-1 text-ficus-lilac hover:bg-ficus-plum/30 hover:text-ficus-cream">
                <X size={12} />
              </button>
            </div>
            {tab.node.id === activeTabId && <p className="text-xs leading-5 text-ficus-lilac">{tab.campus_relevance}</p>}
          </div>
        ))}
      </div>
    </aside>
  );
}

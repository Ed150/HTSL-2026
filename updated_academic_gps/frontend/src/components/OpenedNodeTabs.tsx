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
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Node docs</p>
        <h2 className="text-sm font-medium text-white">Opened details</h2>
      </div>
      <div className="scrollbar flex-1 space-y-2 overflow-auto pr-1">
        {tabs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.05] px-3 py-4 text-xs leading-5 text-slate-400">
            Single-click any bubble to open a richer UofT opportunity page here.
          </div>
        )}
        {tabs.map((tab) => (
          <div
            key={tab.node.id}
            className={`rounded-2xl border px-3 py-3 ${
              tab.node.id === activeTabId ? "border-sky-300/40 bg-white/12" : "border-white/10 bg-white/[0.08]"
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <button onClick={() => onSelect(tab.node.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium text-white">{tab.node.title}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{tab.node.type}</div>
              </button>
              <button onClick={() => onClose(tab.node.id)} className="rounded-full p-1 text-slate-400 hover:bg-white/8 hover:text-white">
                <X size={12} />
              </button>
            </div>
            {tab.node.id === activeTabId && <p className="text-xs leading-5 text-slate-300">{tab.campus_relevance}</p>}
          </div>
        ))}
      </div>
    </aside>
  );
}

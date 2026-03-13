import { useMemo, useState } from "react";
import { NodeDetailPanel } from "../components/NodeDetailPanel";
import { OpenedNodeTabs } from "../components/OpenedNodeTabs";
import { PathBreadcrumb } from "../components/PathBreadcrumb";
import { PathInputForm } from "../components/PathInputForm";
import { PathwayCanvas } from "../components/PathwayCanvas";
import { SavedPathsSidebar } from "../components/SavedPathsSidebar";
import { SummaryPanel } from "../components/SummaryPanel";
import { TopControls } from "../components/TopControls";
import { api } from "../lib/api";
import { DetailResponse, PathRecord, PositionedNode, SummaryResponse, UserProfile } from "../types";

export function App() {
  const [paths, setPaths] = useState<PathRecord[]>([]);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [detailTabs, setDetailTabs] = useState<DetailResponse[]>([]);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [zoom, setZoom] = useState(0.88);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [assistantPrompt, setAssistantPrompt] = useState("Begin with a profile, then build your path one bubble at a time.");

  const activePath = useMemo(() => paths.find((path) => path.id === activePathId) ?? null, [paths, activePathId]);
  const activeDetail = useMemo(() => detailTabs.find((item) => item.node.id === activeDetailId) ?? null, [detailTabs, activeDetailId]);

  const handleStart = async (profile: UserProfile) => {
    setLoading(true);
    try {
      const response = await api.initPath(profile);
      setPaths((current) => [response.path, ...current]);
      setActivePathId(response.path.id);
      setZoom(0.88);
      setAssistantPrompt("Single-click a nearby bubble to inspect the UofT fit, then double-click one to commit it as your next step.");
    } finally {
      setLoading(false);
    }
  };

  const updateActivePath = (nextPath: PathRecord) => {
    setPaths((current) => current.map((path) => (path.id === nextPath.id ? nextPath : path)));
    setActivePathId(nextPath.id);
  };

  const handleExpand = async (node: PositionedNode) => {
    if (!activePath) return;
    if (node.id === activePath.active_node_id) return;
    const fromNodeId = node.visited ? node.id : activePath.active_node_id;
    const response = await api.expandPath(activePath, fromNodeId, node.id);
    updateActivePath(response.path);
    setAssistantPrompt(response.prompt);
  };

  const handleOpenDetail = async (node: PositionedNode) => {
    if (!activePath) return;
    const detail = await api.nodeDetail(activePath, node.id);
    setDetailTabs((current) => {
      const existing = current.find((item) => item.node.id === node.id);
      return existing ? current : [detail, ...current];
    });
    setActiveDetailId(node.id);
  };

  const handleSummarize = async () => {
    if (!activePath) return;
    const result = await api.summarizePath(activePath);
    setSummary(result);
    setSummaryOpen(true);
  };

  const handleDeletePath = (id: string) => {
    setPaths((current) => {
      const remaining = current.filter((path) => path.id !== id);
      if (activePathId === id) {
        setActivePathId(remaining[0]?.id ?? null);
        setDetailTabs([]);
        setActiveDetailId(null);
      }
      return remaining;
    });
  };

  return (
    <div className="relative h-screen overflow-hidden p-3">
      <SummaryPanel summary={summary} open={summaryOpen} onClose={() => setSummaryOpen(false)} />

      {!activePath && <PathInputForm onStart={handleStart} loading={loading} />}

      {activePath && (
        <div className="grid h-full grid-cols-[220px,minmax(0,1fr),260px] gap-3">
          <SavedPathsSidebar
            paths={paths}
            activePathId={activePathId}
            onSelect={setActivePathId}
            onNew={() => setActivePathId(null)}
            onDelete={handleDeletePath}
          />

          <main className="glass relative flex min-w-0 flex-col rounded-[28px] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <PathBreadcrumb items={activePath.breadcrumbs} />
              <TopControls
                zoom={zoom}
                onZoom={setZoom}
                onResetView={() => {
                  const activeNode = activePath.nodes.find((node) => node.id === activePath.active_node_id);
                  setPan(activeNode ? { x: -activeNode.x, y: -activeNode.y } : { x: 0, y: 0 });
                  setZoom(0.88);
                }}
                onSummarize={handleSummarize}
                canSummarize={activePath.summary_ready}
              />
            </div>
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[22px] border border-ficus-cream/10 bg-ficus-forest/20 px-4 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-ficus-lilac">Guide</div>
                <div className="mt-1 text-sm text-ficus-cream">{assistantPrompt}</div>
              </div>
              <div className="text-right text-xs text-ficus-lilac/80">
                <div>Single-click for details</div>
                <div>Double-click to continue the path</div>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <PathwayCanvas
                path={activePath}
                zoom={zoom}
                pan={pan}
                onPanChange={setPan}
                onViewportChange={({ zoom: nextZoom, pan: nextPan }) => {
                  setZoom(nextZoom);
                  setPan(nextPan);
                }}
                onSelect={() => undefined}
                onExpand={handleExpand}
                onOpenDetail={handleOpenDetail}
              />
            </div>
          </main>

          <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="shrink-0">
              <OpenedNodeTabs
                tabs={detailTabs}
                activeTabId={activeDetailId}
                onSelect={setActiveDetailId}
                onClose={(id) => {
                  setDetailTabs((current) => current.filter((item) => item.node.id !== id));
                  setActiveDetailId((current) => (current === id ? null : current));
                }}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <NodeDetailPanel detail={activeDetail} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import ForceGraph2D from "react-force-graph-2d";
import { MapResponse } from "../types";

type Props = {
  map: MapResponse | null;
};

export function MapPanel({ map }: Props) {
  const graphData = {
    nodes: map?.nodes ?? [],
    links: map?.edges.map((edge) => ({ source: edge.source, target: edge.target, label: edge.label, highlighted: edge.highlighted })) ?? []
  };

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Visual Map</p>
          <h2>Academic GPS Pathway Map</h2>
        </div>
        {map && <a className="secondary link-button" href={map.export_path}>Open HTML Export</a>}
      </div>
      <div className="graph-shell">
        {!map && <p className="muted">Generate recommendations to render the interactive pathway network.</p>}
        {map && (
          <ForceGraph2D
            graphData={graphData}
            height={420}
            backgroundColor="rgba(255,255,255,0)"
            nodeLabel={(node) => `${node.label}: ${(node as { detail: string }).detail}`}
            nodeCanvasObject={(node, ctx) => {
              const typedNode = node as unknown as { x: number; y: number; color: string; size: number; label: string; highlighted: boolean };
              ctx.beginPath();
              ctx.arc(typedNode.x, typedNode.y, typedNode.size / 2.5, 0, 2 * Math.PI, false);
              ctx.fillStyle = typedNode.color;
              ctx.fill();
              ctx.lineWidth = typedNode.highlighted ? 3 : 1;
              ctx.strokeStyle = "#0f172a";
              ctx.stroke();
              ctx.font = "12px Space Grotesk";
              ctx.fillStyle = "#0f172a";
              ctx.fillText(typedNode.label, typedNode.x + 12, typedNode.y + 4);
            }}
            linkColor={(link) => (link.highlighted ? "#0f172a" : "#94a3b8")}
            linkWidth={(link) => (link.highlighted ? 2.5 : 1.2)}
          />
        )}
      </div>
    </section>
  );
}

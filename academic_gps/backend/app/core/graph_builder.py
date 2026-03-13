from __future__ import annotations

import json
from pathlib import Path

from app.core.models import DiscoverResponse, GraphEdge, GraphNode, MapResponse


COLORS = {
    "interest": "#1d4ed8",
    "research_area": "#0f766e",
    "professor": "#7c3aed",
    "lab": "#f97316",
    "research_group": "#ea580c",
    "course": "#0891b2",
    "event": "#f43f5e",
    "opportunity": "#14b8a6",
    "alumni": "#16a34a",
    "industry": "#334155",
    "action": "#eab308",
}


class GraphBuilder:
    def build_map(self, result: DiscoverResponse) -> MapResponse:
        interest_node = GraphNode(
            id="interest-anchor",
            label="Your Interest",
            type="interest",
            color=COLORS["interest"],
            detail=result.parsed_intent.get("interest_summary", result.summary),
            size=28,
            highlighted=True,
        )

        nodes = [interest_node]
        edges: list[GraphEdge] = []
        highlighted_path = ["interest-anchor"]

        for rec in result.labs[:3]:
            nodes.append(self._node(rec.id, rec.name, "lab", rec.short_description, rec.relevance_score, True))
            edges.append(GraphEdge(source="interest-anchor", target=rec.id, label="aligned with", highlighted=True))
            highlighted_path.append(rec.id)

        for rec in result.professors[:3]:
            nodes.append(self._node(rec.id, rec.name, "professor", rec.short_description, rec.relevance_score, True))
            target = result.labs[0].id if result.labs else "interest-anchor"
            edges.append(GraphEdge(source=target, target=rec.id, label="led by", highlighted=True))
            highlighted_path.append(rec.id)

        for rec in result.courses[:2]:
            nodes.append(self._node(rec.id, rec.name, "course", rec.short_description, rec.relevance_score))
            source = result.professors[0].id if result.professors else "interest-anchor"
            edges.append(GraphEdge(source=source, target=rec.id, label="learn through"))

        for rec in result.events[:2]:
            nodes.append(self._node(rec.id, rec.name, "event", rec.short_description, rec.relevance_score))
            source = result.professors[0].id if result.professors else "interest-anchor"
            edges.append(GraphEdge(source=source, target=rec.id, label="show up to"))

        for rec in result.alumni[:3]:
            nodes.append(self._node(rec.id, rec.name, "alumni", rec.short_description, rec.relevance_score, True))
            source = result.events[0].id if result.events else (result.professors[0].id if result.professors else "interest-anchor")
            edges.append(GraphEdge(source=source, target=rec.id, label="career pathway", highlighted=True))
            highlighted_path.append(rec.id)

        for action in result.suggested_next_steps[:4]:
            nodes.append(
                GraphNode(
                    id=action.id,
                    label=action.title,
                    type="action",
                    color=COLORS["action"],
                    detail=action.why_it_matters,
                    size=18,
                )
            )
            source = action.related_entity_ids[0] if action.related_entity_ids else "interest-anchor"
            edges.append(GraphEdge(source=source, target=action.id, label="next step"))

        export_path = self._export_html(nodes, edges, highlighted_path)
        return MapResponse(
            title="Academic GPS Pathway Map",
            subtitle=result.pathway.headline,
            nodes=nodes,
            edges=edges,
            highlighted_path=highlighted_path,
            export_path=str(export_path),
        )

    def _node(self, node_id: str, label: str, node_type: str, detail: str, score: float, highlighted: bool = False) -> GraphNode:
        size = 18 + int(score * 14)
        return GraphNode(
            id=node_id,
            label=label,
            type=node_type,  # type: ignore[arg-type]
            color=COLORS[node_type],
            detail=detail,
            size=size,
            highlighted=highlighted,
        )

    def _export_html(self, nodes: list[GraphNode], edges: list[GraphEdge], highlighted_path: list[str]) -> Path:
        output_dir = Path(__file__).resolve().parents[1] / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        export_path = output_dir / "academic_gps_pathway_map.html"
        payload = {
            "nodes": [node.model_dump() for node in nodes],
            "edges": [edge.model_dump() for edge in edges],
            "highlightedPath": highlighted_path,
        }
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Academic GPS Pathway Map</title>
  <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    body {{
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
      background: radial-gradient(circle at top, #eff6ff, #ffffff 45%, #e0f2fe);
      color: #0f172a;
    }}
    .wrap {{
      padding: 32px;
    }}
    #network {{
      height: 78vh;
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Academic GPS Pathway Map</h1>
    <p>Interactive export for hackathon demo mode.</p>
    <div id="network"></div>
  </div>
  <script>
    const payload = {json.dumps(payload)};
    const nodes = new vis.DataSet(payload.nodes.map(node => ({{
      id: node.id,
      label: node.label,
      title: node.detail,
      color: {{
        background: node.color,
        border: node.highlighted ? '#0f172a' : node.color,
        highlight: {{ background: node.color, border: '#0f172a' }}
      }},
      font: {{ color: '#0f172a', size: 18, face: 'Segoe UI' }},
      size: node.size,
      shape: 'dot',
      borderWidth: node.highlighted ? 3 : 1
    }})));
    const edges = new vis.DataSet(payload.edges.map(edge => ({{
      from: edge.source,
      to: edge.target,
      label: edge.label,
      color: edge.highlighted ? '#0f172a' : '#94a3b8',
      width: edge.highlighted ? 3 : 1.5,
      smooth: true,
      font: {{ align: 'middle', size: 12 }}
    }})));
    const container = document.getElementById('network');
    new vis.Network(container, {{ nodes, edges }}, {{
      physics: {{ stabilization: false, barnesHut: {{ springLength: 160 }} }},
      interaction: {{ hover: true }},
      nodes: {{ shadow: true }},
      edges: {{ arrows: {{ to: false }} }}
    }});
  </script>
</body>
</html>"""
        export_path.write_text(html, encoding="utf-8")
        return export_path

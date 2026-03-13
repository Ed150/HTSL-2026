from __future__ import annotations

import os

import networkx as nx


class NeptuneClient:
    def __init__(self) -> None:
        self.endpoint = os.getenv("NEPTUNE_ENDPOINT")
        self.enabled = bool(self.endpoint and os.getenv("ENABLE_NEPTUNE") == "true")
        self.graph = nx.MultiDiGraph()

    def load_local_graph(self, nodes: list[dict], edges: list[dict]) -> None:
        for node in nodes:
            self.graph.add_node(node["id"], **node)
        for edge in edges:
            self.graph.add_edge(edge["source"], edge["target"], label=edge["label"])

    def neighbors(self, node_id: str) -> list[str]:
        return list(self.graph.neighbors(node_id))

from __future__ import annotations

from collections import Counter
from math import log


def tokenize(text: str) -> list[str]:
    cleaned = "".join(ch.lower() if ch.isalnum() else " " for ch in text)
    return [token for token in cleaned.split() if len(token) > 1]


def keyword_score(query_terms: list[str], document: str, tags: list[str] | None = None) -> float:
    tokens = tokenize(document) + tokenize(" ".join(tags or []))
    if not tokens:
        return 0.0
    counts = Counter(tokens)
    score = 0.0
    for term in query_terms:
        if term in counts:
            score += 1.0 + log(1 + counts[term])
    return round(score, 4)


def overlap_score(a: list[str], b: list[str]) -> float:
    if not a or not b:
        return 0.0
    a_set = set(tokenize(" ".join(a)))
    b_set = set(tokenize(" ".join(b)))
    if not a_set or not b_set:
        return 0.0
    return len(a_set & b_set) / len(a_set | b_set)


def normalize_scores(items: list[dict], key: str = "score") -> list[dict]:
    if not items:
        return items
    values = [item[key] for item in items]
    highest = max(values) or 1.0
    for item in items:
        item[key] = round(item[key] / highest, 4)
    return items

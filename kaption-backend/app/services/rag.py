"""Lightweight RAG index over culture_dataset.json (QA pairs).

This module builds a simple TF-IDF based index over concatenated question + answer
texts and provides top-k semantic retrieval for augmenting generation prompts.
"""

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import math
from collections import Counter, defaultdict
import re


logger = logging.getLogger(__name__)


def _basic_tokenize(text: str) -> List[str]:
    """Simple tokenizer: lowercase, remove punctuation, split on whitespace.
    Keeps basic Korean characters and ASCII letters/digits.
    """
    if not text:
        return []
    # Normalize whitespace and lowercase
    t = text.lower()
    # Keep Korean letters (Hangul), ascii letters/digits, and space
    t = re.sub(r"[^0-9a-z\s\uac00-\ud7a3]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t.split()


@dataclass
class RAGDocument:
    doc_id: str
    main_category: str
    sub_category: str
    question: str
    answer: str
    source_file: str
    text: str  # concatenated question + answer


class TfidfIndex:
    """Very small TF-IDF index suitable for ~few thousand docs.

    - Builds vocabulary from tokens
    - Computes IDF per term and L2-normalized TF-IDF vectors per doc
    - Cosine similarity for retrieval
    """

    def __init__(self):
        self.vocab: Dict[str, int] = {}
        self.idf: List[float] = []
        self.doc_vectors: List[List[Tuple[int, float]]] = []  # sparse: (term_index, weight)
        self.documents: List[RAGDocument] = []

    def _build_vocab(self, docs_tokens: List[List[str]]):
        vocab = {}
        for tokens in docs_tokens:
            for tok in tokens:
                if tok not in vocab:
                    vocab[tok] = len(vocab)
        self.vocab = vocab

    def _compute_idf(self, docs_tokens: List[List[str]]):
        df = defaultdict(int)
        num_docs = len(docs_tokens)
        for tokens in docs_tokens:
            seen = set(tokens)
            for tok in seen:
                df[tok] += 1
        idf = [0.0] * len(self.vocab)
        for tok, idx in self.vocab.items():
            # Smoothing to avoid div-by-zero; classic idf
            idf[idx] = math.log((1 + num_docs) / (1 + df.get(tok, 0))) + 1.0
        self.idf = idf

    def _to_sparse_vector(self, tokens: List[str]) -> List[Tuple[int, float]]:
        counts = Counter(tokens)
        items: List[Tuple[int, float]] = []
        for tok, cnt in counts.items():
            idx = self.vocab.get(tok)
            if idx is None:
                continue
            tf = cnt  # raw term frequency
            weight = tf * self.idf[idx]
            if weight > 0:
                items.append((idx, weight))
        # L2 normalize
        norm = math.sqrt(sum(w * w for _, w in items)) or 1.0
        return [(i, w / norm) for i, w in items]

    def build(self, documents: List[RAGDocument]):
        self.documents = documents
        docs_tokens = [_basic_tokenize(doc.text) for doc in documents]
        self._build_vocab(docs_tokens)
        self._compute_idf(docs_tokens)
        self.doc_vectors = [self._to_sparse_vector(tokens) for tokens in docs_tokens]
        logger.info(f"TF-IDF index built: {len(self.documents)} docs, {len(self.vocab)} terms")

    def _cosine(self, a: List[Tuple[int, float]], b: List[Tuple[int, float]]) -> float:
        if not a or not b:
            return 0.0
        # two-pointer merge since indices are unique & unsorted; sort first
        a_sorted = sorted(a)
        b_sorted = sorted(b)
        i = j = 0
        score = 0.0
        while i < len(a_sorted) and j < len(b_sorted):
            ia, wa = a_sorted[i]
            ib, wb = b_sorted[j]
            if ia == ib:
                score += wa * wb
                i += 1
                j += 1
            elif ia < ib:
                i += 1
            else:
                j += 1
        return score

    def search(self, query: str, top_k: int = 5, min_score: float = 0.0) -> List[Tuple[float, RAGDocument]]:
        tokens = _basic_tokenize(query)
        q_vec = self._to_sparse_vector(tokens)
        scores = []
        for dv, doc in zip(self.doc_vectors, self.documents):
            s = self._cosine(q_vec, dv)
            if s >= min_score:
                scores.append((s, doc))
        scores.sort(key=lambda x: x[0], reverse=True)
        return scores[:top_k]


class CultureRAG:
    """Facade for loading culture_dataset.json and performing retrieval."""

    def __init__(self):
        self.index = TfidfIndex()
        self.loaded = False

    def load_from_json(self, dataset_path: str | Path) -> int:
        path = Path(dataset_path)
        if not path.exists():
            raise FileNotFoundError(f"culture dataset not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        qa_pairs: List[Dict[str, Any]] = raw.get("qa_pairs", [])
        docs: List[RAGDocument] = []
        for item in qa_pairs:
            q = (item.get("question") or "").strip()
            a = (item.get("answer") or "").strip()
            text = f"Q: {q}\nA: {a}"
            docs.append(RAGDocument(
                doc_id=str(item.get("id", "")),
                main_category=str(item.get("main_category", "")),
                sub_category=str(item.get("sub_category", "")),
                question=q,
                answer=a,
                source_file=str(item.get("source_file", "")),
                text=text,
            ))
        self.index.build(docs)
        self.loaded = True
        return len(docs)

    def retrieve_context(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.loaded:
            return []
        results = self.index.search(query, top_k=top_k)
        contexts: List[Dict[str, Any]] = []
        for score, doc in results:
            contexts.append({
                "score": round(float(score), 6),
                "id": doc.doc_id,
                "category": f"{doc.main_category}/{doc.sub_category}".strip("/"),
                "question": doc.question,
                "answer": doc.answer,
                "source_file": doc.source_file,
            })
        return contexts



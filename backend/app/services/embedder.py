import re
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
import numpy as np
from app.models.models import LevelScaleAnchor

_model: SentenceTransformer | None = None
_anchor_store: dict | None = None


def get_embedder() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
    return _model


def get_anchor_store(db: Session) -> dict:
    """
    Builds the anchor store on first call and caches it for the lifetime of the process.
    Returns {"embeddings": np.ndarray (N, 768), "meta": [{"element_id", "level"}, ...]}
    """
    global _anchor_store
    if _anchor_store is None:
        anchors = load_anchors(db)
        model = get_embedder()
        texts = [a["text"] for a in anchors]
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        meta = [{"element_id": a["element_id"], "level": a["level"]} for a in anchors]
        _anchor_store = {"embeddings": embeddings, "meta": meta}
    return _anchor_store


_HIGH_SIGNALS = re.compile(
    r"\b(architected|led|leads|leading|designed|built|owned|drove|spearheaded|"
    r"managed|developed|created|implemented|established|directed|oversaw|"
    r"mentored|coached|trained|expert|expertise|proficient|advanced|senior)\b",
    re.IGNORECASE,
)

_LOW_SIGNALS = re.compile(
    r"\b(assisted|supported|helped|familiar|exposure|beginner|introductory)\b|"
    r"familiar with|exposure to|basic knowledge|some experience|learning to",
    re.IGNORECASE,
)


def adjust_levels(scores: dict[str, dict]) -> dict[str, dict]:
    """
    Adjusts each dimension's estimated_level based on proficiency signals
    in its evidence chunk.
    - High signals only  → floor at 50
    - Low signals only   → cap at 40
    - Both or neither    → no change
    Modifies in place and returns the same dict.
    """
    for data in scores.values():
        high = bool(_HIGH_SIGNALS.search(data["evidence"]))
        low  = bool(_LOW_SIGNALS.search(data["evidence"]))
        level = data["estimated_level"]

        if low and not high:
            data["estimated_level"] = round(min(level, 40.0), 1)
        elif high and not low:
            data["estimated_level"] = round(max(level, 50.0), 1)

    return scores


def chunk_text(text: str) -> list[str]:
    """
    Splits a document into chunks suitable for embedding.
    Handles bullet points (lines) and sentence boundaries.
    Drops chunks shorter than 4 words — too short to carry signal.
    """
    chunks = []
    for line in text.splitlines():
        line = line.strip().lstrip("-•*>").strip()
        if not line:
            continue
        # Split on sentence-ending punctuation followed by whitespace
        sentences = re.split(r"(?<=[.!?])\s+", line)
        for s in sentences:
            s = s.strip()
            if len(s.split()) >= 3:
                chunks.append(s)
    return chunks


RELEVANCE_THRESHOLD = 0.25


def score_document(text: str, store: dict) -> dict[str, dict]:
    """
    Scores a document against all anchor embeddings.
    Returns detected dimensions only (similarity >= RELEVANCE_THRESHOLD):
      {element_id: {"similarity": float, "estimated_level": float}}
    estimated_level is the O*NET Level of the best-matching anchor scaled to 0-100.
    """
    chunks = chunk_text(text)
    if not chunks:
        return {}

    model = get_embedder()
    chunk_embeddings = model.encode(chunks, convert_to_numpy=True)  # (C, 768)
    anchor_embeddings = store["embeddings"]                          # (N, 768)

    # Normalise both matrices so dot product = cosine similarity
    chunk_norms  = np.linalg.norm(chunk_embeddings,  axis=1, keepdims=True)
    anchor_norms = np.linalg.norm(anchor_embeddings, axis=1, keepdims=True)
    chunk_embeddings  = chunk_embeddings  / np.maximum(chunk_norms,  1e-10)
    anchor_embeddings = anchor_embeddings / np.maximum(anchor_norms, 1e-10)

    # Similarity matrix: (C, N)
    sim_matrix = chunk_embeddings @ anchor_embeddings.T

    # Max similarity per anchor across all chunks, and which chunk gave it
    max_per_anchor    = sim_matrix.max(axis=0)    # (N,)
    argmax_per_anchor = sim_matrix.argmax(axis=0) # (N,)

    # Per element_id: keep the anchor with the highest similarity
    best: dict[str, dict] = {}
    for sim, meta, cidx in zip(max_per_anchor.tolist(), store["meta"], argmax_per_anchor.tolist()):
        eid = meta["element_id"]
        if sim > best.get(eid, {}).get("similarity", 0.0):
            best[eid] = {"similarity": sim, "level": meta["level"], "evidence": chunks[cidx]}

    # Apply relevance gate and convert level to 0-100 scale
    return {
        eid: {
            "similarity":      data["similarity"],
            "estimated_level": round((data["level"] / 7) * 100, 1),
            "evidence":        data["evidence"],
        }
        for eid, data in best.items()
        if data["similarity"] >= RELEVANCE_THRESHOLD
    }


def load_anchors(db: Session) -> list[dict]:
    """
    Loads all level scale anchors from the DB.
    Returns a list of dicts: {element_id, level, text}
    where level is the raw O*NET anchor_value (integer, 0-7).
    """
    rows = db.query(LevelScaleAnchor).all()
    return [
        {
            "element_id": row.onet_element_id,
            "level":      row.anchor_value,
            "text":       row.anchor_description,
        }
        for row in rows
    ]

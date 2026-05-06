import json
import os
import re
import litellm
from sqlalchemy.orm import Session
from app.models.models import Competency, LevelScaleAnchor

# ─── provider / model selection ───────────────────────────────────────────────
# Set LLM_PROVIDER=gemini in .env to use Gemini (free tier).
# Defaults to Anthropic.

_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic").lower()

_MODEL_MAP = {
    "anthropic": os.getenv("LLM_MODEL_ANTHROPIC", "claude-haiku-4-5-20251001"),
    "gemini":    os.getenv("LLM_MODEL_GEMINI",    "gemini/gemini-2.0-flash"),
}

if _PROVIDER not in _MODEL_MAP:
    raise ValueError(f"Unknown LLM_PROVIDER={_PROVIDER!r}. Choose 'anthropic' or 'gemini'.")

LLM_MODEL = _MODEL_MAP[_PROVIDER]

# Silence litellm's verbose logging.
litellm.suppress_debug_info = True

_system_prompts: dict[str, str] | None = None


def _build_level_guide(db: Session) -> str:
    """
    Derives a level calibration guide from O*NET anchor descriptions.
    Samples up to 3 examples at each of anchor_values 0, 2, 4, 6 to
    illustrate what each checkpoint on the 0-100 scale looks like in practice.
    """
    checkpoints = {0: [], 2: [], 4: [], 6: []}
    rows = (
        db.query(LevelScaleAnchor)
        .filter(LevelScaleAnchor.anchor_value.in_([0, 2, 4, 6]))
        .all()
    )
    for row in rows:
        bucket = checkpoints[row.anchor_value]
        if len(bucket) < 3:
            bucket.append(f"      - {row.anchor_description}")

    labels = {
        0: "0   — negligible / absent",
        2: "28  — basic",
        4: "57  — intermediate",
        6: "86  — advanced",
    }
    lines = [
        "Level scale (0–100). Calibration examples drawn from O*NET anchor descriptions:",
    ]
    for av, label in labels.items():
        examples = "\n".join(checkpoints[av]) if checkpoints[av] else "      (no examples available)"
        lines.append(f"\n  {label}:\n{examples}")
    lines.append("\n  100 — maximum / world-class expertise")
    return "\n".join(lines)


def _build_catalog(db: Session) -> str:
    """
    Formats the full competency catalog grouped by category.
    These are the only element_ids the model is permitted to output.
    """
    rows = (
        db.query(Competency)
        .order_by(Competency.category, Competency.onet_element_id)
        .all()
    )
    lines = ["Competency catalog — output ONLY element_ids listed here:"]
    current_cat = None
    for row in rows:
        if row.category != current_cat:
            current_cat = row.category
            lines.append(f"\n  [{current_cat}]")
        lines.append(f"    {row.onet_element_id}  {row.competency_name}")
    return "\n".join(lines)


_RESUME_FORMAT = """\
Output format — valid JSON only, no markdown, no extra text:
{
  "<element_id>": {"level": <float 0–100 or null>}
}

Rules:
- Include ONLY competencies with clear evidence in the text.
- Use a float for level when you can reliably estimate it from the text.
- Use null for level when the competency is clearly present but depth cannot be inferred.
- Omit competencies entirely when there is no evidence."""


_JOB_FORMAT = """\
Output format — valid JSON only, no markdown, no extra text:
{
  "<element_id>": {
    "required_level": <float 0–100 or null>,
    "importance": <float 0.0–1.0 or null>,
    "requirement_type": "required" | "preferred"
  }
}

Rules:
- Include ONLY competencies with clear evidence in the job description.
- required_level: minimum proficiency the candidate must have. null when mentioned but level is unclear.
- importance: how central this competency is to the role (0.0 = peripheral, 1.0 = essential). null when not inferrable.
- requirement_type: "required" if the posting uses language like "must have", "required", "essential", \
"mandatory", or strong equivalents; otherwise "preferred".
- Omit competencies entirely when there is no evidence."""


_RESUME_EXAMPLES = """\
Examples:

Text: "Designed and led implementation of a distributed event-streaming platform (50M events/day). \
Managed a team of 7 engineers. Deep expertise in Python, SQL, and PostgreSQL query optimisation. \
Presented architecture decisions to executive stakeholders quarterly."
Output:
{
  "2.C.3.a": {"level": 88},
  "2.A.2.b": {"level": 70},
  "2.A.1.a": {"level": null}
}

Text: "Assisted senior developers with code reviews. Familiar with Python. \
Attended sprint planning meetings."
Output:
{
  "2.C.3.a": {"level": 28},
  "2.A.1.b": {"level": null}
}"""


_JOB_EXAMPLES = """\
Examples:

Text: "Must have 5+ years of Python development. Strong written communication required. \
Cloud deployment experience is a plus."
Output:
{
  "2.C.3.a": {"required_level": 80, "importance": 0.95, "requirement_type": "required"},
  "2.A.2.a": {"required_level": 65, "importance": 0.80, "requirement_type": "required"},
  "2.C.7.a": {"required_level": null, "importance": 0.45, "requirement_type": "preferred"}
}

Text: "Looking for a motivated team player with some technical background."
Output:
{
  "4.A.1.b.1": {"required_level": null, "importance": null, "requirement_type": "preferred"},
  "2.C.3.a": {"required_level": null, "importance": null, "requirement_type": "preferred"}
}"""


def _build_prompts(db: Session) -> dict[str, str]:
    level_guide = _build_level_guide(db)
    catalog = _build_catalog(db)

    resume_prompt = "\n\n".join([
        "You are an expert HR analyst trained on the O*NET competency framework.\n"
        "Analyse the resume text and identify which O*NET competencies are demonstrated.\n"
        "Output ONLY element_ids from the Competency Catalog below.",
        level_guide,
        catalog,
        _RESUME_FORMAT,
        _RESUME_EXAMPLES,
    ])

    job_prompt = "\n\n".join([
        "You are an expert HR analyst trained on the O*NET competency framework.\n"
        "Analyse the job description and identify which O*NET competencies are required or preferred.\n"
        "Output ONLY element_ids from the Competency Catalog below.",
        level_guide,
        catalog,
        _JOB_FORMAT,
        _JOB_EXAMPLES,
    ])

    return {"resume": resume_prompt, "job": job_prompt}


def _get_prompts(db: Session) -> dict[str, str]:
    global _system_prompts
    if _system_prompts is None:
        _system_prompts = _build_prompts(db)
    return _system_prompts


def _parse_response(text: str) -> dict:
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


def score_document(text: str, db: Session, mode: str) -> dict:
    """
    Scores a document against the O*NET competency catalog using an LLM.

    mode: "resume" | "job"

    Returns:
      mode="resume": {element_id: {"level": float | None}}
      mode="job":    {element_id: {"required_level": float | None, "importance": float | None}}

    A key present with null value means: detected, but level/importance could not be inferred.
    A missing key means: not detected.
    Raises ValueError on bad mode, json.JSONDecodeError on unparseable response.
    """
    if mode not in ("resume", "job"):
        raise ValueError(f"mode must be 'resume' or 'job', got {mode!r}")

    prompts = _get_prompts(db)

    response = litellm.completion(
        model=LLM_MODEL,
        max_tokens=4096,
        temperature=0,
        messages=[
            {"role": "system", "content": prompts[mode]},
            {"role": "user",   "content": text},
        ],
    )

    return _parse_response(response.choices[0].message.content)

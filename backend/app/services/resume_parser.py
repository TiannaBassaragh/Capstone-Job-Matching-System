"""
resume_parser.py

Converts a resume stored as raw bytes in the DB into clean plain text.
Supports PDF and Word (.docx) formats.

Usage:
  from resume_parser import parse_resume_bytes

  text = parse_resume_bytes(resume.resume_file)
  # returns a plain string ready for the embedding pipeline

Install dependencies:
  pip install pdfminer.six python-docx
"""

import io
from pdfminer.high_level import extract_text as pdf_extract_text
from docx import Document


def parse_resume_bytes(data: bytes) -> str:
  """
  Accepts raw bytes from the resume_file LONGBLOB column.
  Detects format by magic bytes and returns clean plain text.
  Raises ValueError for unsupported formats.
  """
  if _is_pdf(data):
    return _parse_pdf(data)
  if _is_docx(data):
    return _parse_docx(data)
  raise ValueError(
    "Unsupported file format. Only PDF and .docx are accepted."
  )


# ─── format detection ────────────────────────────────────────────────────────

def _is_pdf(data: bytes) -> bool:
  return data[:4] == b"%PDF"


def _is_docx(data: bytes) -> bool:
  # .docx is a ZIP archive — magic bytes are PK\x03\x04
  return data[:4] == b"PK\x03\x04"


# ─── parsers ─────────────────────────────────────────────────────────────────

def _parse_pdf(data: bytes) -> str:
  text = pdf_extract_text(io.BytesIO(data))
  return _clean(text)


def _parse_docx(data: bytes) -> str:
  doc = Document(io.BytesIO(data))
  paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
  return _clean("\n".join(paragraphs))


# ─── cleaning ────────────────────────────────────────────────────────────────

def _clean(text: str) -> str:
  """
  Normalises whitespace and removes noise characters.
  Does not strip meaningful punctuation — that is the embedding model's job.
  """
  if not text:
    raise ValueError("Parsed resume produced no text. File may be empty or image-only.")

  lines = text.splitlines()
  cleaned = []
  for line in lines:
    line = line.strip()
    # drop lines that are pure whitespace or single-character noise
    if len(line) > 1:
      cleaned.append(line)

  result = "\n".join(cleaned)

  if not result.strip():
    raise ValueError("Parsed resume produced no text. File may be empty or image-only.")

  return result
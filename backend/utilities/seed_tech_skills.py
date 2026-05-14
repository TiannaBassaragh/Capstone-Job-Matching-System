#!/usr/bin/env python3
"""
seed_tech_skills.py — Populate the tech_skills table from O*NET 30.2.

Seeds only hot_technology=Y or in_demand=Y entries (323 distinct names).
These are the skills the LLM prompt will draw from when extracting tech
keywords from CVs and job descriptions.

Usage:
  cd backend
  python utilities/seed_tech_skills.py
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from app.database import SessionLocal
from app.models.models import TechSkill


def main() -> None:
    sql_path = Path(__file__).parent / "31_technology_skills.sql"
    with open(sql_path) as f:
        content = f.read()

    rows = re.findall(
        r"VALUES\s*\('[^']+',\s*'([^']+)',\s*\d+,\s*'([YN])',\s*'([YN])'\)\s*;",
        content,
    )

    # Keep only hot or in-demand skills; lowercase for consistent matching
    names = sorted(set(
        e.lower() for e, hot, demand in rows
        if hot == "Y" or demand == "Y"
    ))

    db = SessionLocal()
    try:
        db.query(TechSkill).delete()
        for name in names:
            db.add(TechSkill(name=name))
        db.commit()
        print(f"Seeded {len(names)} tech skills (hot_technology=Y or in_demand=Y).")
    finally:
        db.close()


if __name__ == "__main__":
    main()

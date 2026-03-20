"""
seed_competencies.py

Populates the competencies table from two O*NET 30.2 SQL files:
  01_content_model_reference.sql
  06_level_scale_anchors.sql

Download both from:
  https://www.onetcenter.org/dl_files/database/db_30_2_mysql/01_content_model_reference.sql
  https://www.onetcenter.org/dl_files/database/db_30_2_mysql/06_level_scale_anchors.sql

Place them in the same directory as this script, then run:
  python seed_competencies.py

Only elements that appear in level_scale_anchors are inserted (161 scoreable
descriptors across Abilities, Work Activities, and Work Styles).
"""

import re
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
  print("ERROR: DATABASE_URL not set in .env")
  sys.exit(1)

CMR_FILE = "01_content_model_reference.sql"
LSA_FILE = "06_level_scale_anchors.sql"

# Derived from actual element_id prefixes present in the anchor file.
# Ordered longest-first so startswith matching is unambiguous.
DOMAIN_CATEGORY = [
  ("1.A", "Abilities"),
  ("2.A", "Basic Skills"),
  ("2.B", "Cross-Functional Skills"),
  ("2.C", "Knowledge"),
  ("2.D", "Education"),
  ("4.A", "Work Styles"),
]


def extract_first_value(filepath):
  """
  Extracts the first VALUES argument from every INSERT statement.
  Each O*NET INSERT is a single row: INSERT INTO t (...) VALUES ('id', ...);
  Returns a set of element_id strings.
  """
  with open(filepath, encoding="utf-8") as f:
    content = f.read()
  # Match the first quoted value in each VALUES clause
  return set(re.findall(r"VALUES \('([^']+)'", content))


def load_content_model(filepath):
  """
  Parses every INSERT row from the content model reference file.
  Returns dict: element_id -> {competency_name, description}
  """
  with open(filepath, encoding="utf-8") as f:
    content = f.read()

  # Each row: VALUES ('element_id', 'element_name', 'description')
  pattern = re.compile(
    r"VALUES \('([^']+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'\)",
    re.DOTALL
  )

  result = {}
  for m in pattern.finditer(content):
    element_id  = m.group(1)
    element_name = m.group(2).replace("''", "'")
    description  = m.group(3).replace("''", "'")
    result[element_id] = {
      "competency_name": element_name,
      "description": description or element_name,
    }
  return result


def derive_category(element_id):
  for prefix, category in DOMAIN_CATEGORY:
    if element_id.startswith(prefix):
      return category
  return "Other"


def seed(engine, content_model, leaf_ids):
  rows_to_insert = []
  for element_id in sorted(leaf_ids):
    if element_id not in content_model:
      print(f"  WARNING: {element_id} not found in content model, skipping.")
      continue
    entry = content_model[element_id]
    rows_to_insert.append({
      "onet_element_id": element_id,
      "competency_name": entry["competency_name"],
      "description":     entry["description"],
      "category":        derive_category(element_id),
    })

  if not rows_to_insert:
    print("ERROR: No rows to insert. Check that the SQL files are correct.")
    sys.exit(1)

  with engine.begin() as conn:
    conn.execute(text("""
      INSERT INTO competencies (onet_element_id, competency_name, description, category)
      VALUES (:onet_element_id, :competency_name, :description, :category)
      ON DUPLICATE KEY UPDATE
        competency_name = VALUES(competency_name),
        description     = VALUES(description),
        category        = VALUES(category)
    """), rows_to_insert)

  print(f"Seeded {len(rows_to_insert)} competencies.")


def main():
  for path in [CMR_FILE, LSA_FILE]:
    if not os.path.exists(path):
      print(f"ERROR: File not found: {path}")
      print("Download from https://www.onetcenter.org/dl_files/database/db_30_2_mysql/")
      sys.exit(1)

  print("Parsing content model reference...")
  content_model = load_content_model(CMR_FILE)
  print(f"  {len(content_model)} elements loaded.")

  print("Parsing level scale anchors...")
  leaf_ids = extract_first_value(LSA_FILE)
  print(f"  {len(leaf_ids)} unique element IDs found.")

  engine = create_engine(DATABASE_URL)
  seed(engine, content_model, leaf_ids)


if __name__ == "__main__":
  main()
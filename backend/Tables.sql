CREATE DATABASE IF NOT EXISTS job_matching_system;
USE job_matching_system;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  user_id      INT          AUTO_INCREMENT PRIMARY KEY,
  f_name       VARCHAR(100) NOT NULL,
  l_name       VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password     VARCHAR(150) NOT NULL,
  account_type ENUM('applicant','recruiter') NOT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- CANDIDATES
CREATE TABLE IF NOT EXISTS candidates (
  candidate_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNIQUE NOT NULL,
  FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

-- EMPLOYERS
CREATE TABLE IF NOT EXISTS employers (
  employer_id  INT          AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          UNIQUE NOT NULL,
  company_name VARCHAR(200),
  FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

-- RESUMES
CREATE TABLE IF NOT EXISTS resumes (
  resume_id    INT       AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT       NOT NULL,
  resume_file  LONGBLOB,
  upload_date  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id)
    REFERENCES candidates(candidate_id)
    ON DELETE CASCADE
);

-- JOB POSTS
CREATE TABLE IF NOT EXISTS job_post (
  job_id      INT          AUTO_INCREMENT PRIMARY KEY,
  employer_id INT          NOT NULL,
  title       VARCHAR(200),
  description TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employer_id)
    REFERENCES employers(employer_id)
    ON DELETE CASCADE
);

-- COMPETENCIES
-- onet_element_id: O*NET content model identifier (e.g. "2.A.1.a")
--   used to join back to O*NET source data when seeding Importance/Level values
-- description: the O*NET descriptor description text
--   embedded once at seeding time to produce the anchor vector for this dimension
CREATE TABLE IF NOT EXISTS competencies (
  competency_id   INT          AUTO_INCREMENT PRIMARY KEY,
  competency_name VARCHAR(200) UNIQUE NOT NULL,
  category        VARCHAR(100),
  onet_element_id VARCHAR(20)  UNIQUE,
  description     TEXT
);

-- CANDIDATE COMPETENCIES
-- level_score: the pipeline's estimated O*NET Level value for this candidate
--   on this dimension, on a 0–100 scale matching O*NET's Level anchors.
--   Produced by combining the anchor-based embedding estimate with
--   spaCy proficiency signal adjustments.
CREATE TABLE IF NOT EXISTS candidate_competencies (
  candidate_id INT   NOT NULL,
  competency_id INT  NOT NULL,
  level_score   FLOAT NOT NULL,
  PRIMARY KEY (candidate_id, competency_id),
  FOREIGN KEY (candidate_id)
    REFERENCES candidates(candidate_id)
    ON DELETE CASCADE,
  FOREIGN KEY (competency_id)
    REFERENCES competencies(competency_id)
);

-- JOB COMPETENCIES
-- required_level: the minimum O*NET Level the candidate must demonstrate
--   on this dimension to satisfy the job's requirement. Derived from
--   the job posting text via the mapping pipeline.
-- importance: the O*NET Importance rating for this dimension on this job,
--   used as the weight in the fit score aggregation formula.
--   Sourced from O*NET occupational data, adjusted by posting text signals.
-- requirement_type: 'required' dimensions are subject to the knockout check;
--   'preferred' dimensions contribute to the fit score but cannot disqualify.
CREATE TABLE IF NOT EXISTS job_competencies (
  job_id           INT   NOT NULL,
  competency_id    INT   NOT NULL,
  required_level   FLOAT NOT NULL,
  importance       FLOAT,
  requirement_type ENUM('required','preferred'),
  PRIMARY KEY (job_id, competency_id),
  FOREIGN KEY (job_id)
    REFERENCES job_post(job_id)
    ON DELETE CASCADE,
  FOREIGN KEY (competency_id)
    REFERENCES competencies(competency_id)
);

-- MATCHES
-- match_score: the importance-weighted fit score (0–1) for this candidate-job pair.
--   Higher is better. Used for ranking within the qualified candidate pool.
-- knockout_failed: TRUE if the candidate fell short on any dimension flagged
--   as a knockout criterion (high O*NET Importance or explicit "must have" language).
--   Knockout candidates are excluded from employer-facing results.
-- gap_profile: JSON document containing the per-dimension breakdown of the match.
--   Stores fit value, required level, candidate level, and gap for each dimension.
--   Used to power the transparency layer shown to both employers and candidates.
-- explanation: human-readable summary of the match result, suitable for display.
CREATE TABLE IF NOT EXISTS matches (
  match_id        INT       AUTO_INCREMENT PRIMARY KEY,
  candidate_id    INT       NOT NULL,
  job_id          INT       NOT NULL,
  match_score     FLOAT,
  knockout_failed BOOLEAN   DEFAULT FALSE,
  gap_profile     JSON,
  explanation     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (candidate_id, job_id),
  FOREIGN KEY (candidate_id)
    REFERENCES candidates(candidate_id)
    ON DELETE CASCADE,
  FOREIGN KEY (job_id)
    REFERENCES job_post(job_id)
    ON DELETE CASCADE
);

SHOW TABLES;
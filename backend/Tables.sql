CREATE DATABASE IF NOT EXISTS job_matching_system;
USE job_matching_system;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    f_name VARCHAR(100) NOT NULL,
    l_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(150) NOT NULL,
    account_type ENUM('applicant','recruiter') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CANDIDATES
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- EMPLOYERS
CREATE TABLE IF NOT EXISTS employers (
    employer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    company_name VARCHAR(200),
    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- RESUMES
CREATE TABLE IF NOT EXISTS resumes (
    resume_id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    resume_file LONGBLOB,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id)
        REFERENCES candidates(candidate_id)
        ON DELETE CASCADE
);

-- JOB POSTS
CREATE TABLE IF NOT EXISTS job_post (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    title VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id)
        REFERENCES employers(employer_id)
        ON DELETE CASCADE
);

-- COMPETENCIES
CREATE TABLE IF NOT EXISTS competencies (
    competency_id INT AUTO_INCREMENT PRIMARY KEY,
    competency_name VARCHAR(200) UNIQUE NOT NULL,
    category VARCHAR(100)
);

-- CANDIDATE COMPETENCIES
CREATE TABLE IF NOT EXISTS candidate_competencies (
    candidate_id INT NOT NULL,
    competency_id INT NOT NULL,
    proficiency_level VARCHAR(50),
    years_experience INT,
    PRIMARY KEY (candidate_id, competency_id),
    FOREIGN KEY (candidate_id)
        REFERENCES candidates(candidate_id)
        ON DELETE CASCADE,
    FOREIGN KEY (competency_id)
        REFERENCES competencies(competency_id)
);

-- JOB COMPETENCIES
CREATE TABLE IF NOT EXISTS job_competencies (
    job_id INT NOT NULL,
    competency_id INT NOT NULL,
    requirement_type ENUM('required','preferred'),
    weight FLOAT,
    PRIMARY KEY (job_id, competency_id),
    FOREIGN KEY (job_id)
        REFERENCES job_post(job_id)
        ON DELETE CASCADE,
    FOREIGN KEY (competency_id)
        REFERENCES competencies(competency_id)
);

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    job_id INT NOT NULL,
    qualification_status ENUM('qualified','not_qualified'),
    match_score FLOAT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, job_id),
    FOREIGN KEY (candidate_id)
        REFERENCES candidates(candidate_id)
        ON DELETE CASCADE,
    FOREIGN KEY (job_id)
        REFERENCES job_post(job_id)
        ON DELETE CASCADE
);

SHOW TABLES;
// mappers.js
// Transforms raw backend API responses into the shapes the frontend expects.
// All score values: backend uses 0.0–1.0 floats, frontend uses 0–100 integers.

import { generateColour } from "./colours";

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (val) => val != null ? Math.round(val * 100) : null;

const NA = "N/A";

const TIER_LABELS = {
    strong_fit:         "Strong fit",
    decent_fit:         "Decent fit",
    below_requirements: "Below requirements",
    data_gap:           "Insufficient data",
};

export function formatTier(tier) {
    if (!tier) return NA;
    return TIER_LABELS[tier] ?? tier.replace(/_/g, " ");
}

// ── Auth / User ───────────────────────────────────────────────────────────────

export function mapUser(user) {
    return {
        userId:      user.user_id,
        userType:    user.account_type,          // "applicant" | "recruiter"
        userName:    user.account_type === "recruiter"
                        ? (user.company_name ?? NA)
                        : `${user.f_name} ${user.l_name}`,
        email:       user.email,
        candidateId: user.candidate_id ?? null,
        employerId:  user.employer_id  ?? null,
        companyName: user.company_name ?? null,
    };
}

// ── Matches (candidate view) ──────────────────────────────────────────────────

export function mapRecommendation(rec) {
    const { bg, color } = generateColour(rec.company_name);
    return {
        id:          rec.match_id,
        jobId:       rec.job_id,
        userName:    rec.company_name    ?? NA,
        title:       rec.title           ?? NA,
        score:       pct(rec.match_score) || pct(rec.recommendation_score) || 0,
        location:    null,                       // not in backend
        workType:    null,                       // not in backend
        payLow:      null,                       // not in backend
        payHigh:     null,                       // not in backend
        isNew:       false,                      // not in backend
        tier:        rec.qualification_tier ?? null,
        explanation: rec.explanation     ?? null,
        gapProfile:  rec.gap_profile     ?? null,
        bg,
        color,
    };
}

export function mapRecommendations(recs) {
    return recs.map(mapRecommendation);
}

// ── Gap profile → skills (strong / partial / missing) ────────────────────────
//
// Backend gap_profile shape:
// { competency_name: { gap, required_level, candidate_level } }
//
// Frontend expects: { strong: [], partial: [], missing: [] }

export function mapGapProfileToSkills(gapProfile) {
    if (!gapProfile) return { strong: [], partial: [], missing: [] };

    const strong  = [];
    const partial = [];
    const missing = [];

    Object.entries(gapProfile).forEach(([name, v]) => {
        const candidateVal = v.candidate_level ?? 0;
        if (candidateVal >= 80)       strong.push(name);
        else if (candidateVal >= 40)  partial.push(name);
        else                          missing.push(name);
    });

    return { strong, partial, missing };
}

// ── Competencies ──────────────────────────────────────────────────────────────
//
// Backend CandidateCompetencyEntry: { competency_id, competency_name, category, level_score }
// Frontend CompetencyPanel expects: [{ key, label, value (0-100), desc }]

export function mapCompetencies(competencies) {
    return competencies.map(c => ({
        key:   c.competency_id ?? c.competency_name,
        label: c.competency_name,
        value: c.level_score    != null ? Math.round(c.level_score)    :
               c.required_level != null ? Math.round(c.required_level) : 0,
        desc:  c.category ?? "",
    }));
}

// ── Jobs (recruiter view) ─────────────────────────────────────────────────────

export function mapJob(job) {
    const { bg, color } = generateColour(job.title);
    return {
        id:         job.job_id,
        title:      job.title        ?? NA,
        userName:   job.title        ?? NA,   // used for initials
        description: job.description ?? NA,
        status:     job.is_active ? "active" : "inactive",
        postedDate: job.created_at
                        ? new Date(job.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : NA,
        location:   NA,                       // not in backend
        workType:   NA,                       // not in backend
        matches:    0,                        // populated separately from rankings
        newCount:   0,                        // not in backend
        bg,
        color,
    };
}

export function mapJobs(jobs) {
    return jobs.map(mapJob);
}

// ── Candidate rankings (recruiter view) ──────────────────────────────────────

export function mapCandidateRanking(entry) {
    const { bg, color } = generateColour(entry.candidate_name);
    return {
        id:         entry.candidate_id,
        matchId:    entry.match_id,
        userName:   entry.candidate_name ?? NA,
        headline:   NA,                        // not in backend
        score:      pct(entry.match_score),
        tier:       entry.qualification_tier ?? null,
        isNew:      false,                     // not in backend
        shortlisted: false,
        skills:     [],                        // populated separately from profile
        bg,
        color,
    };
}

export function mapCandidateRankings(rankings) {
    return rankings.map(mapCandidateRanking);
}

// ── Resume ────────────────────────────────────────────────────────────────────

export function mapResume(resume) {
    if (!resume) return null;
    return {
        resumeId:   resume.resume_id,
        uploadDate: resume.upload_date
                        ? new Date(resume.upload_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : NA,
        fileName:   `resume_${resume.resume_id}.pdf`,
        pages:      1,                         // not in backend
    };
}
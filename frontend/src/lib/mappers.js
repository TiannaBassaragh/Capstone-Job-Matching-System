// mappers.js
// Transforms raw backend API responses into the shapes the frontend expects.
// All score values: backend uses 0.0–1.0 floats, frontend uses 0–100 integers.

import { generateColour } from "./colours";

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (val) => val != null ? Math.round(val * 100) : null;

const NA = "N/A";

const TIER_LABELS = {
    strong_fit:  "Strong fit",
    data_gap:    "Insufficient data",
    partial_fit: "Partial fit",
};

export function formatTier(tier) {
    if (!tier) return NA;
    return TIER_LABELS[tier] ?? tier.replace(/_/g, " ");
}

// ── Auth / User ───────────────────────────────────────────────────────────────

export function mapUser(user) {
    return {
        userId:       user.user_id,
        userType:     user.account_type,          // "applicant" | "recruiter"
        userName:     user.account_type === "recruiter"
                          ? (user.company_name ?? NA)
                          : `${user.f_name} ${user.l_name}`,
        fName:        user.f_name       ?? "",
        lName:        user.l_name       ?? "",
        email:        user.email,
        avatar:       user.avatar        ?? null,
        candidateId:  user.candidate_id  ?? null,
        employerId:   user.employer_id   ?? null,
        companyName:  user.company_name  ?? null,
        employerLogo: user.employer_logo ?? null,
        headline:     user.headline      ?? null,
        bio:          user.bio           ?? null,
    };
}

// ── Matches (candidate view) ──────────────────────────────────────────────────

export function mapRecommendation(rec) {
    const { bg, color } = generateColour(rec.company_name);
    return {
        id:             rec.match_id,
        jobId:          rec.job_id,
        userName:       rec.company_name    ?? NA,
        companyLogo:    rec.company_logo    ?? null,
        title:          rec.title           ?? NA,
        description:    rec.description     ?? null,
        score:          rec.job_score != null ? pct(rec.job_score) : null,
        location:       rec.location   ?? null,
        workType:       rec.work_type  ?? null,
        payLow:         rec.pay_low    ?? null,
        payHigh:        rec.pay_high   ?? null,
        experience:     rec.experience ?? null,
        expiresAt:      rec.expires_at ?? null,
        isNew:          false,
        tier:           rec.qualification_tier ?? null,
        explanation:    rec.explanation     ?? null,
        gapProfile:     rec.gap_profile     ?? null,
        shortlisted:    rec.shortlisted     ?? false,
        interested:     rec.interested      ?? false,
        recruiterName:  rec.recruiter_name  ?? null,
        recruiterEmail: rec.recruiter_email ?? null,
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
    if (!gapProfile) return { strong: [], partial: [], low: [], unclear: [], missing: [] };

    const strong  = [];
    const partial = [];
    const low     = [];
    const unclear = [];
    const missing = [];

    // Scored dimensions — classify by candidate's absolute proficiency level (0–100)
    Object.values(gapProfile.scored ?? {}).forEach(v => {
        const level = v.candidate_level ?? 0;
        if (level >= 80)      strong.push(v.name);
        else if (level >= 40) partial.push(v.name);
        else                  low.push(v.name);
    });

    // Undetermined — job required it, detected but level couldn't be inferred
    Object.values(gapProfile.undetermined ?? {}).forEach(v => {
        unclear.push(v.name);
    });

    // Absent — no evidence in resume for a job-required competency
    Object.values(gapProfile.absent ?? {}).forEach(v => {
        missing.push(v.name);
    });

    return { strong, partial, low, unclear, missing };
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

    let status = job.is_active ? "active" : "inactive";
    if (job.is_active && job.expires_at) {
        const msUntilExpiry = new Date(job.expires_at) - Date.now();
        if (msUntilExpiry <= 3 * 24 * 60 * 60 * 1000) {
            status = "expiring";
        }
    }

    return {
        id:          job.job_id,
        title:       job.title        ?? NA,
        userName:    job.title        ?? NA,   // used for initials
        description: job.description  ?? NA,
        status,
        postedDate:  job.created_at
                         ? new Date(job.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                         : NA,
        expiresAt:   job.expires_at ?? null,
        location:    job.location   ?? NA,
        workType:    job.work_type  ?? NA,
        experience:  job.experience ?? NA,
        payLow:      job.pay_low    ?? null,
        payHigh:     job.pay_high   ?? null,
        matches:     0,                        // populated separately from rankings
        bg,
        color,
    };
}

export function mapJobs(jobs) {
    return jobs.map(mapJob);
}

// ── Candidate rankings (recruiter view) ──────────────────────────────────────

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function mapCandidateRanking(entry) {
    const { bg, color } = generateColour(entry.candidate_name);
    const isNew = entry.match_created_at
        ? (Date.now() - new Date(entry.match_created_at).getTime()) < ONE_WEEK_MS
        : false;
    return {
        id:          entry.candidate_id,
        matchId:     entry.match_id,
        jobId:       entry.job_id ?? null,
        userName:    entry.candidate_name ?? NA,
        avatar:      entry.candidate_avatar ?? null,
        headline:    entry.qualification_tier ? formatTier(entry.qualification_tier) : NA,
        score:       pct(entry.job_score),
        tier:        entry.qualification_tier ?? null,
        isNew,
        shortlisted: entry.shortlisted ?? false,
        skills:      [],                       // populated separately from profile
        bg,
        color,
    };
}

export function mapCandidateRankings(rankings) {
    return rankings.map(mapCandidateRanking);
}

// ── Notifications ─────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "Just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days < 7)    return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function timeGroup(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "today";
    if (days < 7) return "week";
    return "earlier";
}

export function mapNotification(n) {
    return {
        id:    n.notification_id,
        type:  n.type,
        title: n.title,
        desc:  n.description ?? "",
        time:  timeAgo(n.created_at),
        group: timeGroup(n.created_at),
        read:  n.read,
        link:  n.link ?? null,
    };
}

export function mapNotifications(notifications) {
    return notifications.map(mapNotification);
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
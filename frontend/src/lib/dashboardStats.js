// dashboardStats.js

export function buildCandidateStats(matches, totalCount) {
    const total  = totalCount ?? matches.length;
    const top     = matches.length > 0 && matches[0]?.score > 0 ? matches[0].score : null;
    const topName = matches[0]?.title ?? null;

    return [
        {
            value:   total,
            label:   "Total matches",
            subtext: "from your resume",
            icon:    "new",
            color:   { bg: "#E1F5EE", stroke: "#0F6E56", subtextBg: "#E1F5EE", subtextText: "#0F6E56" },
        },
        {
            value:   top != null ? `${top}%` : "—",
            label:   "Best match score",
            subtext: topName ?? "Upload resume to match",
            icon:    "topMatches",
            color:   { bg: "#FFF3E0", stroke: "#BA7517", subtextBg: "#FFF3E0", subtextText: "#854F0B" },
        },
        {
            value:   matches.filter(m => m.tier === "strong_fit").length,
            label:   "Strong matches",
            subtext: "strong fit tier",
            icon:    "matches",
            color:   { bg: "#F3EFFE", stroke: "#7F77DD", subtextBg: "#F3EFFE", subtextText: "#534AB7" },
        },
    ];
}

export function buildEmployerStats(jobs, totalCandidates, newMatchCount) {
    const active = jobs.filter(j => j.status === "active" || j.status === "expiring").length;

    return [
        {
            value:   active,
            label:   "Active postings",
            subtext: `${jobs.length} total jobs`,
            icon:    "activePostings",
            color:   { bg: "#EDF2FD", stroke: "#4B7FE3", subtextBg: "#EDF2FD", subtextText: "#1D3E9E" },
        },
        {
            value:   newMatchCount ?? 0,
            label:   "New matches",
            subtext: "this week",
            icon:    "new",
            color:   { bg: "#E1F5EE", stroke: "#0F6E56", subtextBg: "#E1F5EE", subtextText: "#0F6E56" },
        },
        {
            value:   totalCandidates,
            label:   "Total candidates matched",
            subtext: "across all jobs",
            icon:    "users",
            color:   { bg: "#F3EFFE", stroke: "#7F77DD", subtextBg: "#F3EFFE", subtextText: "#534AB7" },
        },
    ];
}

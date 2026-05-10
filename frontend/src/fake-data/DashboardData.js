// DashboardData.js
export const dashboardContent = {
    candidate: {
        welcomeCard: {
            highlights: [
                { value: "87%", label: "top match", highlight: true },
                { value: "24", label: "total matches" },
                { value: "6", label: "new this week" },
                // {"value": "92%", "label": "profile done"}
            ],
        },

        statsRow: [
            {
                value: "6",
                label: "New matches",
                subtext: "+6 this week",
                icon: "new",
                color: {
                    bg: "#E1F5EE",
                    stroke: "#0F6E56",
                    subtextBg: "#E1F5EE",
                    subtextText: "#0F6E56",
                },
            },
            {
                value: "87%",
                label: "Best match score",
                subtext: "Google · SWE",
                icon: "topMatches",
                color: {
                    bg: "#FFF3E0",
                    stroke: "#BA7517",
                    subtextBg: "#FFF3E0",
                    subtextText: "#854F0B",
                },
            },
            {
                value: "24",
                label: "Total matches",
                subtext: "All time",
                icon: "matches",
                color: {
                    bg: "#F3EFFE",
                    stroke: "#7F77DD",
                    subtextBg: "#F3EFFE",
                    subtextText: "#534AB7",
                },
            },
            // {
            //     value: "3",
            //     label: "Employers viewed",
            //     subtext: "your profile",
            //     icon: "users",
            //     color: {
            //         bg: "#FBEAF0",
            //         stroke: "#D4537E",
            //         subtextBg: "#FBEAF0",
            //         subtextText: "#993556",
            //     },
            // },
        ],

        uploadPanel: {
            currentFileName: "alex_johnson_resume_v3.pdf",
            currentFileDate: "Uploaded Mar 12, 2026",
        },

        sortOptions: [
            "Best overall match",
            "Highest percentile fit",
            "Highest pay",
            "Most recently posted",
        ],

        matches: [
            { id: 1, userName: "Google",     bg: "#E8F2FF", color: "#1a55a8", title: "Senior Frontend Engineer",  location: "Remote",  workType: "Full-time", payLow: 140, payHigh: 180, score: 87 },
            { id: 2, userName: "Spotify",    bg: "#E8FFF4", color: "#1a7a4a", title: "Full Stack Developer",      location: "Hybrid",  workType: "Full-time", payLow: 120, payHigh: 155, score: 81 },
            { id: 3, userName: "Salesforce", bg: "#FFF6E8", color: "#a06010", title: "React Developer",           location: "On-site", workType: "Full-time", payLow: 110, payHigh: 140, score: 74 },
            { id: 4, userName: "Slack",      bg: "#F3F0FF", color: "#5a40c0", title: "UI Engineer",               location: "Remote",  workType: "Full-time", payLow: 105, payHigh: 130, score: 68 },
            { id: 5, userName: "Square",     bg: "#FFF0F5", color: "#a0305a", title: "Software Engineer II",      location: "Hybrid",  workType: "Full-time", payLow: 100, payHigh: 125, score: 55 },
            { id: 6, userName: "Netflix",    bg: "#FFF0F0", color: "#903030", title: "Frontend Engineer",         location: "Remote",  workType: "Full-time", payLow: 130, payHigh: 160, score: 48 },
        ],
    },

    employer: {
        welcomeCard: {
            highlights: [
                { value: "5", label: "active postings", highlight: true },
                { value: "146", label: "total matched" },
                { value: "18", label: "new this week" },
                // {"value": "2", "label": "expiring soon", "warning": true}
            ],
        },

        statsRow: [
            {
                value: "5",
                label: "Active postings",
                subtext: "+1 this month",
                icon: "activePostings",
                color: {
                bg: "#EDF2FD",
                stroke: "#4B7FE3",
                subtextBg: "#EDF2FD",
                subtextText: "#1D3E9E",
                },
            },
            {
                value: "18",
                label: "New matches",
                subtext: "+18 this week",
                icon: "new",
                color: {
                bg: "#E1F5EE",
                stroke: "#0F6E56",
                subtextBg: "#E1F5EE",
                subtextText: "#0F6E56",
                },
            },
            {
                value: "146",
                label: "Total candidates matched",
                subtext: "across all jobs",
                icon: "users",
                color: {
                bg: "#F3EFFE",
                stroke: "#7F77DD",
                subtextBg: "#F3EFFE",
                subtextText: "#534AB7",
                },
            },
            // {
            //     value: "2",
            //     label: "Expiring soon",
            //     subtext: "action needed",
            //     icon: "warning",
            //     color: {
            //         bg: "#FFF3E0",
            //         stroke: "#BA7517",
            //         subtextBg: "#FFF3E0",
            //         subtextText: "#854F0B",
            //     },
            // },
        ],

        uploadPanel: {
            currentFileName: "",
            currentFileDate: "",
        },

        jobs: [
            { id: 1, userName: "Backend Engineer",  bg: "#EDF2FD", color: "#1D3E9E", title: "Backend Engineer",         location: "Remote",  workType: "Full-time", postedDate: "Jan 28, 2026", status: "active",   matches: 61, newCount: 7 },
            { id: 2, userName: "Frontend Engineer", bg: "#EDF2FD", color: "#1D3E9E", title: "Senior Frontend Engineer", location: "Remote",  workType: "Full-time", postedDate: "Mar 1, 2026",  status: "active",   matches: 42, newCount: 5 },
            { id: 3, userName: "Data Science",      bg: "#E1F5EE", color: "#0F6E56", title: "Data Scientist",           location: "Hybrid",  workType: "Full-time", postedDate: "Feb 20, 2026", status: "active",   matches: 28, newCount: 4 },
            { id: 4, userName: "Product",           bg: "#FFF3E0", color: "#854F0B", title: "Product Manager",          location: "On-site", workType: "Full-time", postedDate: "Feb 10, 2026", status: "expiring", matches: 15, newCount: 0 },
            { id: 5, userName: "UX Design",         bg: "#FBEAF0", color: "#72243E", title: "UX Designer",              location: "Hybrid",  workType: "Full-time", postedDate: "Jan 15, 2026", status: "expiring", matches: 9,  newCount: 0 },
        ],

        topCandidates: [
            { userName: "Alex Johnson", bg: "#EDF2FD", color: "#1D3E9E", job: "Senior Frontend Eng.", score: 87 },
            { userName: "Maya Roberts", bg: "#FBEAF0", color: "#72243E", job: "Data Scientist",       score: 81 },
            { userName: "James Kim",    bg: "#FFF3E0", color: "#854F0B", job: "Senior Frontend Eng.", score: 74 },
        ],

        activity: [
            { type: "match", text: ["7 new matches", " for Backend Engineer"], time: "Today · 2 hours ago" },
            { type: "match", text: ["5 new matches", " for Senior Frontend Eng."], time: "Today · 5 hours ago" },
            { type: "match", text: ["4 new matches", " for Data Scientist"], time: "Yesterday" },
            { type: "expiring", text: ["Product Manager posting ", "expiring", " in 3 days"], time: "Mar 17, 2026" },
            { type: "posted", text: ["Senior Frontend Engineer posted"], time: "Mar 1, 2026" },
        ],
    },
};

export const panelContent = {
    candidate: dashboardContent.candidate.uploadPanel,
    employer: dashboardContent.employer.uploadPanel,
};

export const statsRow = {
    candidate: dashboardContent.candidate.statsRow,
    employer: dashboardContent.employer.statsRow
}

export const highlights = {
    candidate: dashboardContent.candidate.highlights,
    employer: dashboardContent.employer.highlights
}

export const sortOptions = dashboardContent.candidate.sortOptions;

export const employerJobs = dashboardContent.employer.jobs;

export const employerTopCandidates = dashboardContent.employer.topCandidates;

export const employerActivity = dashboardContent.employer.activity;

// ── Matches page data ────────────────────────────────────────────────────────

export const candidateMatches = [
    { id: 1,  userName: "Google",     bg: "#E8F2FF", color: "#1a55a8", title: "Senior Frontend Engineer",    location: "Remote",  workType: "Full-time", payLow: 140, payHigh: 180, score: 87 },
    { id: 2,  userName: "Spotify",    bg: "#E8FFF4", color: "#1a7a4a", title: "Full Stack Developer",         location: "Hybrid",  workType: "Full-time", payLow: 120, payHigh: 155, score: 81 },
    { id: 3,  userName: "Salesforce", bg: "#FFF6E8", color: "#a06010", title: "React Developer",              location: "On-site", workType: "Full-time", payLow: 110, payHigh: 140, score: 74 },
    { id: 4,  userName: "Slack",      bg: "#F3F0FF", color: "#5a40c0", title: "UI Engineer",                  location: "Remote",  workType: "Full-time", payLow: 105, payHigh: 130, score: 68 },
    { id: 5,  userName: "Square",     bg: "#FFF0F5", color: "#a0305a", title: "Software Engineer II",         location: "Hybrid",  workType: "Full-time", payLow: 100, payHigh: 125, score: 55 },
    { id: 6,  userName: "Netflix",    bg: "#FFF0F0", color: "#903030", title: "Frontend Engineer",            location: "Remote",  workType: "Full-time", payLow: 130, payHigh: 160, score: 48 },
    { id: 7,  userName: "Airbnb",     bg: "#E8F2FF", color: "#1a55a8", title: "Software Engineer",            location: "Remote",  workType: "Full-time", payLow: 115, payHigh: 145, score: 83 },
    { id: 8,  userName: "Twitter",    bg: "#E8FFF4", color: "#1a7a4a", title: "Frontend Developer",           location: "Remote",  workType: "Full-time", payLow: 100, payHigh: 130, score: 77 },
    { id: 9,  userName: "Microsoft",  bg: "#FFF6E8", color: "#a06010", title: "JavaScript Engineer",          location: "Hybrid",  workType: "Full-time", payLow: 120, payHigh: 150, score: 71 },
    { id: 10, userName: "Uber",       bg: "#F3F0FF", color: "#5a40c0", title: "Web Developer",                location: "On-site", workType: "Full-time", payLow: 95,  payHigh: 120, score: 63 },
    { id: 11, userName: "LinkedIn",   bg: "#FFF0F5", color: "#a0305a", title: "React Native Developer",       location: "Remote",  workType: "Full-time", payLow: 110, payHigh: 135, score: 59 },
    { id: 12, userName: "Apple",      bg: "#FFF0F0", color: "#903030", title: "Frontend Platform Engineer",   location: "On-site", workType: "Full-time", payLow: 135, payHigh: 165, score: 44 },
    { id: 13, userName: "Dropbox",    bg: "#E8F2FF", color: "#1a55a8", title: "Staff Engineer",               location: "Remote",  workType: "Full-time", payLow: 150, payHigh: 190, score: 91 },
    { id: 14, userName: "Facebook",   bg: "#E8FFF4", color: "#1a7a4a", title: "Product Engineer",             location: "Hybrid",  workType: "Full-time", payLow: 130, payHigh: 165, score: 85 },
    { id: 15, userName: "Shopify",    bg: "#FFF6E8", color: "#a06010", title: "Senior React Developer",       location: "Remote",  workType: "Full-time", payLow: 115, payHigh: 145, score: 79 },
    { id: 16, userName: "HubSpot",    bg: "#F3F0FF", color: "#5a40c0", title: "Engineering Lead",             location: "Hybrid",  workType: "Full-time", payLow: 130, payHigh: 160, score: 52 },
    { id: 17, userName: "Zoom",       bg: "#FFF0F5", color: "#a0305a", title: "Frontend Architect",           location: "Remote",  workType: "Full-time", payLow: 140, payHigh: 175, score: 38 },
    { id: 18, userName: "Pinterest",  bg: "#FFF0F0", color: "#903030", title: "UI/UX Engineer",               location: "Hybrid",  workType: "Full-time", payLow: 105, payHigh: 135, score: 66 },
];

// ── Job listings page data ───────────────────────────────────────────────────

export const allEmployerJobs = [
    { id: 1,  userName: "Backend Engineer",      bg: "#EDF2FD", color: "#1D3E9E", title: "Backend Engineer",             location: "Remote",  workType: "Full-time", postedDate: "Jan 28, 2026", status: "active",   matches: 61,  newCount: 7 },
    { id: 2,  userName: "Frontend Engineer",     bg: "#EDF2FD", color: "#1D3E9E", title: "Senior Frontend Engineer",     location: "Remote",  workType: "Full-time", postedDate: "Mar 1, 2026",  status: "active",   matches: 42,  newCount: 5 },
    { id: 3,  userName: "Data Science",          bg: "#E1F5EE", color: "#0F6E56", title: "Data Scientist",               location: "Hybrid",  workType: "Full-time", postedDate: "Feb 20, 2026", status: "active",   matches: 28,  newCount: 4 },
    { id: 4,  userName: "Product",               bg: "#FFF3E0", color: "#854F0B", title: "Product Manager",              location: "On-site", workType: "Full-time", postedDate: "Feb 10, 2026", status: "expiring", matches: 15,  newCount: 0 },
    { id: 5,  userName: "UX Design",             bg: "#FBEAF0", color: "#72243E", title: "UX Designer",                  location: "Hybrid",  workType: "Full-time", postedDate: "Jan 15, 2026", status: "expiring", matches: 9,   newCount: 0 },
    { id: 6,  userName: "ML Engineering",        bg: "#E1F5EE", color: "#0F6E56", title: "Machine Learning Engineer",    location: "Remote",  workType: "Full-time", postedDate: "Apr 3, 2026",  status: "active",   matches: 33,  newCount: 8 },
    { id: 7,  userName: "DevOps",                bg: "#EDF2FD", color: "#1D3E9E", title: "DevOps Engineer",              location: "Remote",  workType: "Full-time", postedDate: "Mar 20, 2026", status: "active",   matches: 19,  newCount: 2 },
    { id: 8,  userName: "Security",              bg: "#F3EFFE", color: "#534AB7", title: "Security Analyst",             location: "On-site", workType: "Full-time", postedDate: "Mar 5, 2026",  status: "active",   matches: 11,  newCount: 1 },
    { id: 9,  userName: "Tech Lead",             bg: "#FFF3E0", color: "#854F0B", title: "Tech Lead",                    location: "Hybrid",  workType: "Full-time", postedDate: "Jan 5, 2026",  status: "expiring", matches: 22,  newCount: 0 },
    { id: 10, userName: "Marketing Ops",         bg: "#FBEAF0", color: "#72243E", title: "Marketing Operations Lead",    location: "Remote",  workType: "Full-time", postedDate: "Dec 10, 2025", status: "inactive", matches: 6,   newCount: 0 },
    { id: 11, userName: "QA",                    bg: "#E1F5EE", color: "#0F6E56", title: "QA Engineer",                  location: "Hybrid",  workType: "Full-time", postedDate: "Feb 1, 2026",  status: "inactive", matches: 4,   newCount: 0 },
    { id: 12, userName: "Site Reliability",      bg: "#EDF2FD", color: "#1D3E9E", title: "Site Reliability Engineer",    location: "Remote",  workType: "Full-time", postedDate: "Apr 10, 2026", status: "active",   matches: 38,  newCount: 6 },
];
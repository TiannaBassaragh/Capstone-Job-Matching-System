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
            { id: 1, userName: "G G", bg: "#E8F2FF", color: "#1a55a8", title: "Senior Frontend Engineer", meta: "Google · Remote · $140k – $180k", score: 87 },
            { id: 2, userName: "S P", bg: "#E8FFF4", color: "#1a7a4a", title: "Full Stack Developer", meta: "Spotify · Hybrid · $120k – $155k", score: 81 },
            { id: 3, userName: "S F", bg: "#FFF6E8", color: "#a06010", title: "React Developer", meta: "Salesforce · On-site · $110k – $140k", score: 74 },
            { id: 4, userName: "S L", bg: "#F3F0FF", color: "#5a40c0", title: "UI Engineer", meta: "Slack · Remote · $105k – $130k", score: 68 },
            { id: 5, userName: "S Q", bg: "#FFF0F5", color: "#a0305a", title: "Software Engineer II", meta: "Square · Hybrid · $100k – $125k", score: 55 },
            { id: 6, userName: "N T", bg: "#FFF0F0", color: "#903030", title: "Frontend Engineer", meta: "Netflix · Remote · $130k – $160k", score: 48 },
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
            { id: 1, userName: "B E", bg: "#EDF2FD", color: "#1D3E9E", title: "Backend Engineer", meta: "Remote · posted Jan 28, 2026", status: "active", matches: 61, newCount: 7 },
            { id: 2, userName: "F E", bg: "#EDF2FD", color: "#1D3E9E", title: "Senior Frontend Engineer", meta: "Remote · posted Mar 1, 2026", status: "active", matches: 42, newCount: 5 },
            { id: 3, userName: "D S", bg: "#E1F5EE", color: "#0F6E56", title: "Data Scientist", meta: "Hybrid · posted Feb 20, 2026", status: "active", matches: 28, newCount: 4 },
            { id: 4, userName: "P M", bg: "#FFF3E0", color: "#854F0B", title: "Product Manager", meta: "On-site · posted Feb 10, 2026", status: "expiring", matches: 15, newCount: 0 },
            { id: 5, userName: "U X", bg: "#FBEAF0", color: "#72243E", title: "UX Designer", meta: "Hybrid · posted Jan 15, 2026", status: "expiring", matches: 9, newCount: 0 },
        ],

        topCandidates: [
            { userName: "A J", bg: "#EDF2FD", color: "#1D3E9E", name: "Alex Johnson", job: "Senior Frontend Eng.", score: 87 },
            { userName: "M R", bg: "#FBEAF0", color: "#72243E", name: "Maya Roberts", job: "Data Scientist", score: 81 },
            { userName: "J K", bg: "#FFF3E0", color: "#854F0B", name: "James Kim", job: "Senior Frontend Eng.", score: 74 },
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

export const candidateMatches = dashboardContent.candidate.matches;

export const employerJobs = dashboardContent.employer.jobs;

export const employerTopCandidates = dashboardContent.employer.topCandidates;

export const employerActivity = dashboardContent.employer.activity;

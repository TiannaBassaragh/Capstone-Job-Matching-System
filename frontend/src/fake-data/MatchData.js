// MatchData.js — fake match-specific data (swap with backend later)

export const matchSkills = {
    1:  { strong: ["React", "TypeScript", "System Design", "CSS", "Git"], partial: ["GraphQL", "Testing"], missing: ["Docker", "Kubernetes"] },
    2:  { strong: ["Node.js", "React", "REST APIs", "JavaScript"], partial: ["PostgreSQL", "Redis"], missing: ["Kafka"] },
    3:  { strong: ["React", "CRM", "Salesforce", "JavaScript"], partial: ["Apex", "Lightning"], missing: [] },
    4:  { strong: ["Figma", "CSS", "Accessibility", "HTML"], partial: ["Motion", "Animation"], missing: ["Storybook"] },
    5:  { strong: ["Go", "Payments", "APIs"], partial: ["gRPC", "Protobuf"], missing: ["Kafka", "Backend infra"] },
    6:  { strong: ["React", "CSS", "JavaScript"], partial: ["Performance", "Profiling"], missing: ["SSR", "Next.js"] },
    7:  { strong: ["React", "Ruby on Rails", "PostgreSQL"], partial: ["AWS", "S3"], missing: ["Terraform", "CDK"] },
    8:  { strong: ["JavaScript", "React", "APIs"], partial: ["WebSockets", "Real-time"], missing: ["Scala", "Akka"] },
    9:  { strong: ["TypeScript", "Azure", "JavaScript"], partial: ["C#", ".NET"], missing: ["WPF", "MAUI"] },
    10: { strong: ["JavaScript", "HTML", "CSS", "Vue"], partial: ["PHP"], missing: ["Laravel", "MySQL"] },
    11: { strong: ["React Native", "iOS", "JavaScript"], partial: ["Android", "Kotlin"], missing: ["SwiftUI"] },
    12: { strong: ["Swift", "Xcode", "iOS"], partial: ["SwiftUI", "Combine"], missing: ["ARKit", "Metal"] },
    13: { strong: ["React", "TypeScript", "GraphQL", "Design Systems", "CSS"], partial: [], missing: ["Rust", "WASM"] },
    14: { strong: ["React", "Python", "Data", "APIs"], partial: ["Spark", "Pandas"], missing: ["Airflow", "dbt"] },
    15: { strong: ["React", "Shopify", "Liquid", "JavaScript"], partial: ["Hydrogen", "Remix"], missing: [] },
    16: { strong: ["React", "Team Lead", "Code Review", "TypeScript"], partial: ["OKRs", "Roadmaps"], missing: ["Hiring pipelines"] },
    17: { strong: ["Architecture", "React", "TypeScript"], partial: ["Micro-frontends", "Webpack"], missing: ["Module Federation", "Nx"] },
    18: { strong: ["Figma", "React", "CSS", "HTML"], partial: ["Framer Motion", "GSAP"], missing: ["After Effects", "Lottie"] },
};

export const competencyDetails = [
    { key: "technical",  label: "Technical skills",  desc: "Languages, frameworks, tools, and engineering practices" },
    { key: "problem",    label: "Problem solving",   desc: "Debugging, system design, architectural decisions" },
    { key: "comms",      label: "Communication",     desc: "Written docs, cross-team coordination, stakeholder clarity" },
    { key: "leadership", label: "Leadership",        desc: "Mentorship, project ownership, code review culture" },
    { key: "domain",     label: "Domain knowledge",  desc: "Industry context, specialised technical depth" },
];

export const whyItFits = {
    1:  "Your React and TypeScript experience directly maps to what Google is looking for. The role sits within a team building large-scale UI systems — exactly the kind of work your resume shows depth in. The $140k–$180k band also places this role in the top tier of your match range.",
    2:  "Spotify values engineers who can work across the stack, and your full-stack background aligns well. The hybrid setup suits candidates who prefer flexibility, and the team works with live streaming infrastructure — an area your API experience transfers to naturally.",
    3:  "Salesforce roles tend to reward familiarity with CRM workflows and React, both of which are clearly present in your background. The on-site nature means stronger team integration — good if you prefer collaborative environments.",
    4:  "Slack's UI team is known for its focus on accessibility and interaction quality, two areas your resume speaks to. This role values CSS craft and thoughtful design implementation over pure engineering throughput.",
    5:  "Square's payments infrastructure team looks for engineers comfortable with reliability and correctness over feature speed. Your background in Go and payments-adjacent work positions you well for the engineering culture here.",
    default: "Your profile aligns with the core competencies this role requires. The strongest overlap is in your technical skills and domain experience, which are the primary drivers of this match score.",
};

export const recruiterInfo = {
    1:  { userName: "Priya Nair",   title: "Technical Recruiter",   email: "priya.nair@google.com" },
    2:  { userName: "James Osei",   title: "Engineering Recruiter", email: "j.osei@spotify.com" },
    3:  { userName: "Maria Gomez",  title: "Senior Recruiter",      email: "mgomez@salesforce.com" },
    4:  { userName: "Tyler Brooks", title: "Talent Acquisition",    email: "tbrooks@slack.com" },
    5:  { userName: "Aisha Kamara", title: "Technical Recruiter",   email: "a.kamara@squareup.com" },
    default: { userName: "Recruiter", title: "Hiring Team",         email: "recruiting@company.com" },
};

// ── Job-specific data ─────────────────────────────────────────────────────────

export const jobDescriptions = {
    1: "We're looking for a backend engineer to join our infrastructure team. You'll own core services, work closely with frontend and platform teams, and contribute to architectural decisions as we scale. The ideal candidate is comfortable with distributed systems, has strong opinions about API design, and can move fast without breaking things.",
    2: "Join our frontend team to build performant, accessible user interfaces used by millions. You'll work closely with design and product to ship polished experiences, contribute to our component library, and help define frontend architecture going forward.",
    3: "We need a data scientist to help us make sense of the signals in our product data. You'll build models, run experiments, and work with engineering to productionise your work. Strong Python skills and experience with ML pipelines are essential.",
    4: "We're hiring a product manager to own our core user-facing product area. You'll define strategy, work with engineering and design, and be accountable for outcomes. Experience in B2B SaaS and strong communication skills are a must.",
    5: "Our UX designer will shape how users experience our product end to end. You'll run research, create wireframes and prototypes, and work closely with engineering to ensure quality implementation. A strong portfolio with end-to-end case studies is required.",
    default: "We are looking for a talented individual to join our growing team. You will work closely with cross-functional teams to deliver high-quality results. Strong communication skills and the ability to work independently are key.",
};

export const jobCandidates = {
    1: [
        { id: 1,  userName: "Alex Johnson",  bg: "#EDF2FD", color: "#1D3E9E", headline: "Backend Engineer · 5 yrs",      skills: ["Node.js", "Python", "AWS"],      score: 87, isNew: true,  shortlisted: true  },
        { id: 2,  userName: "Maya Roberts",  bg: "#FBEAF0", color: "#72243E", headline: "Full Stack Dev · 3 yrs",        skills: ["Python", "Django", "PostgreSQL"], score: 81, isNew: true,  shortlisted: false },
        { id: 3,  userName: "James Kim",     bg: "#FFF3E0", color: "#854F0B", headline: "Backend Engineer · 6 yrs",      skills: ["Go", "Kubernetes", "gRPC"],       score: 74, isNew: false, shortlisted: false },
        { id: 4,  userName: "Sara Chen",     bg: "#E1F5EE", color: "#0F6E56", headline: "Software Engineer · 4 yrs",     skills: ["Java", "Spring", "MySQL"],        score: 69, isNew: false, shortlisted: false },
        { id: 5,  userName: "Omar Farouq",   bg: "#F3EFFE", color: "#534AB7", headline: "Backend Engineer · 7 yrs",      skills: ["Rust", "Go", "Kafka"],            score: 63, isNew: true,  shortlisted: false },
        { id: 6,  userName: "Priya Shah",    bg: "#FFF6E8", color: "#a06010", headline: "Software Engineer · 2 yrs",     skills: ["Python", "FastAPI", "Redis"],     score: 58, isNew: false, shortlisted: false },
    ],
    2: [
        { id: 7,  userName: "Leo Martinez",  bg: "#E8F2FF", color: "#1a55a8", headline: "Frontend Engineer · 4 yrs",    skills: ["React", "TypeScript", "CSS"],     score: 91, isNew: true,  shortlisted: true  },
        { id: 8,  userName: "Aisha Kamara",  bg: "#E8FFF4", color: "#1a7a4a", headline: "UI Engineer · 3 yrs",           skills: ["Vue", "Figma", "SCSS"],           score: 78, isNew: false, shortlisted: false },
        { id: 9,  userName: "Tom Nguyen",    bg: "#FFF6E8", color: "#a06010", headline: "Frontend Dev · 5 yrs",          skills: ["React", "Redux", "GraphQL"],      score: 72, isNew: true,  shortlisted: false },
    ],
    default: [
        { id: 10, userName: "Jane Smith",    bg: "#EDF2FD", color: "#1D3E9E", headline: "Software Engineer · 4 yrs",    skills: ["Python", "SQL", "APIs"],          score: 76, isNew: false, shortlisted: false },
        { id: 11, userName: "Mark Davis",    bg: "#E1F5EE", color: "#0F6E56", headline: "Senior Engineer · 6 yrs",       skills: ["Java", "AWS", "Docker"],          score: 68, isNew: true,  shortlisted: false },
    ],
};

export const jobActivity = {
    1: [
        { type: "match",   text: "7 new candidates matched",  time: "Today · 2 hours ago" },
        { type: "match",   text: "5 new candidates matched",  time: "Yesterday" },
        { type: "match",   text: "4 new candidates matched",  time: "3 days ago" },
        { type: "posted",  text: "Job posting went live",     time: "Jan 28, 2026" },
        { type: "created", text: "Job posting created",       time: "Jan 27, 2026" },
    ],
    2: [
        { type: "match",   text: "5 new candidates matched",  time: "Today · 5 hours ago" },
        { type: "match",   text: "3 new candidates matched",  time: "2 days ago" },
        { type: "posted",  text: "Job posting went live",     time: "Mar 1, 2026" },
    ],
    default: [
        { type: "match",   text: "New candidates matched",    time: "Recently" },
        { type: "posted",  text: "Job posting went live",     time: "Recently" },
    ],
};

export const candidateSkillsForJob = {
    1:  { strong: ["Node.js", "Python", "AWS", "REST APIs"], partial: ["Kubernetes"], missing: ["Terraform", "Go"] },
    2:  { strong: ["Python", "Django", "PostgreSQL"],         partial: ["Redis"],      missing: ["Kafka", "gRPC"]  },
    3:  { strong: ["Go", "Kubernetes", "gRPC"],               partial: ["Terraform"],  missing: ["Rust"]           },
    7:  { strong: ["React", "TypeScript", "CSS"],             partial: ["GraphQL"],    missing: ["Next.js"]        },
    8:  { strong: ["Vue", "Figma", "SCSS"],                   partial: ["React"],      missing: ["TypeScript"]     },
    9:  { strong: ["React", "Redux", "GraphQL"],              partial: ["TypeScript"], missing: []                 },
    default: { strong: ["Python", "SQL"],                     partial: ["Docker"],     missing: ["Kubernetes"]     },
};

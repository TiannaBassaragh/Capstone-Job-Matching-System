// competencyConfig.js
// Static config — the 5 high-level competency category labels shown on
// the candidate's MatchDetails page. Not user data, just labels.
// Lives in lib/ so utils/matches.js no longer has to import from fake-data/.

export const competencyDetails = [
    { key: "technical",  label: "Technical skills", desc: "Languages, frameworks, tools, and engineering practices" },
    { key: "problem",    label: "Problem solving",  desc: "Debugging, system design, architectural decisions" },
    { key: "comms",      label: "Communication",    desc: "Written docs, cross-team coordination, stakeholder clarity" },
    { key: "leadership", label: "Leadership",       desc: "Mentorship, project ownership, code review culture" },
    { key: "domain",     label: "Domain knowledge", desc: "Industry context, specialised technical depth" },
];

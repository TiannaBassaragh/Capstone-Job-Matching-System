import { useParams, useNavigate } from "react-router-dom";
import { PageCard, PanelCard, ScorePanel, CompetencyPanel, SkillsPanel, RecruiterPanel } from "../../components";
import { getInitials, getCompetencyScores } from "../../utils";
import { candidateMatches } from "../../fake-data/DashboardData";
import { matchSkills, whyItFits, recruiterInfo } from "../../fake-data/MatchData";
import "./MatchDetails.css";

export default function MatchDetails() {
    const { matchId } = useParams();
    const navigate    = useNavigate();
    const match       = candidateMatches.find(m => m.id === Number(matchId));

    if (!match) {
        return (
            <PageCard breadcrumb="Matches / Details" title="Match Details">
                <PanelCard>
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                        Match not found.{" "}
                        <button
                            onClick={() => navigate("/matches")}
                            style={{ color: "var(--acc)", fontWeight: 600 }}
                        >
                            Go back to matches.
                        </button>
                    </p>
                </PanelCard>
            </PageCard>
        );
    }

    const comps     = getCompetencyScores(match.score);
    const skills    = matchSkills[match.id]   || matchSkills[1];
    const recruiter = recruiterInfo[match.id] || recruiterInfo.default;
    const why       = whyItFits[match.id]     || whyItFits.default;

    const competencyCounts = {
        strong:  comps.filter(c => c.value >= 80).length,
        partial: comps.filter(c => c.value >= 60 && c.value < 80).length,
        weak:    comps.filter(c => c.value < 60).length,
    };

    const strongest = [...comps].sort((a, b) => b.value - a.value)[0].label;
    const weakest   = [...comps].sort((a, b) => a.value - b.value)[0].label;

    return (
        <PageCard breadcrumb={`Matches / ${match.userName} ${match.title}`} title="Match Details">
            <div className="layout">

                <div className="left">

                    <PanelCard>
                        <div className="hero">
                            <div className="hero-icon" style={{ background: match.bg, color: match.color }}>
                                {getInitials(match.userName)}
                            </div>
                            <div className="hero-body">
                                <div className="hero-title">{match.title}</div>
                                <div className="hero-meta">
                                    {match.userName} · {match.location} · ${match.payLow}k – ${match.payHigh}k
                                </div>
                            </div>
                            <button type="button" className="back-btn" onClick={() => navigate("/matches")}>
                                ← All matches
                            </button>
                        </div>
                    </PanelCard>

                    <PanelCard>
                        <div className="section-label">Why this fits you</div>
                        <p className="why-text">{why}</p>
                    </PanelCard>

                    <PanelCard>
                        <div className="section-label">About the role</div>
                        <div className="facts">
                            <div className="fact-row">
                                <span className="fact-key">Work type</span>
                                <span className="fact-val">{match.workType}</span>
                            </div>
                            <div className="fact-row">
                                <span className="fact-key">Location</span>
                                <span className="fact-val">{match.location}</span>
                            </div>
                            <div className="fact-row">
                                <span className="fact-key">Salary</span>
                                <span className="fact-val">${match.payLow}k – ${match.payHigh}k</span>
                            </div>
                            <div className="fact-row">
                                <span className="fact-key">Experience</span>
                                <span className="fact-val">4+ years</span>
                            </div>
                        </div>
                        <div className="job-description">
                            This role sits within a team focused on building reliable, scalable software systems. You'll work alongside engineers, designers, and product managers to ship features that directly affect end users. The team values ownership, clear communication, and high engineering standards. You'll have room to propose technical direction and be expected to contribute meaningfully to code reviews and design discussions.
                        </div>
                    </PanelCard>

                    <CompetencyPanel competencies={comps} />

                    <SkillsPanel skills={skills} />

                </div>

                <div className="right">

                    <ScorePanel score={match.score} counts={competencyCounts} />

                    <RecruiterPanel recruiter={recruiter} jobTitle={match.title} />

                    <PanelCard>
                        <div className="section-label">Match context</div>
                        <div className="context-list">
                            <div className="context-row">
                                <span className="context-key">Your score</span>
                                <span className="context-val">{match.score}%</span>
                            </div>
                            <div className="context-row">
                                <span className="context-key">Skills matched</span>
                                <span className="context-val">
                                    {skills.strong.length} of {skills.strong.length + skills.partial.length + skills.missing.length}
                                </span>
                            </div>
                            <div className="context-row">
                                <span className="context-key">Strongest area</span>
                                <span className="context-val">{strongest}</span>
                            </div>
                            <div className="context-row">
                                <span className="context-key">Gap area</span>
                                <span className="context-val">{weakest}</span>
                            </div>
                        </div>
                    </PanelCard>

                </div>
            </div>
        </PageCard>
    );
}
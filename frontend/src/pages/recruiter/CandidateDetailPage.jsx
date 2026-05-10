import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageCard, PanelCard } from "../../components/cards";
import { CompetencyPanel, SkillsPanel, ScorePanel } from "../../components/panels";
import { EmailIcon, FileIcon } from "../../components/icons";
import { ResumeModal } from "../../components/content";
import { getInitials, getScoreStyle, getCompetencyScores } from "../../utils";
import { jobCandidates, candidateSkillsForJob } from "../../fake-data/MatchData";
import { allEmployerJobs } from "../../fake-data/DashboardData";
import "./CandidateDetailPage.css";

// ── Fake resume data per candidate ───────────────────────────────────────────

const candidateResumes = {
    1:  { fileName: "alex_johnson_resume_v2.pdf",  pages: 2 },
    2:  { fileName: "maya_roberts_resume.pdf",      pages: 1 },
    3:  { fileName: "james_kim_cv_2026.pdf",        pages: 2 },
    4:  { fileName: "sara_chen_resume.pdf",         pages: 1 },
    5:  { fileName: "omar_farouq_resume_v3.pdf",    pages: 2 },
    6:  { fileName: "priya_shah_resume.pdf",        pages: 1 },
    7:  { fileName: "leo_martinez_resume.pdf",      pages: 2 },
    8:  { fileName: "aisha_kamara_cv.pdf",          pages: 1 },
    9:  { fileName: "tom_nguyen_resume_2026.pdf",   pages: 2 },
    default: { fileName: "candidate_resume.pdf",   pages: 1 },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
    const { jobId, candidateId } = useParams();
    const navigate               = useNavigate();
    const location               = useLocation();
    const [showResume, setShowResume] = useState(false);

    const job        = allEmployerJobs.find(j => j.id === Number(jobId));
    const candidates = jobCandidates[jobId]   || jobCandidates.default;
    const candidate  = candidates.find(c => c.id === Number(candidateId))
                    || location.state?.candidate;

    const goBack = () => navigate(`/jobs/${jobId}`, { state: { tab: "candidates" } });

    if (!candidate) {
        return (
            <PageCard breadcrumb={`Jobs / ${job.title} / Candidate`} title="Candidate Detail">
                <PanelCard>
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                        Candidate not found.{" "}
                        <button onClick={goBack} style={{ color: "var(--acc)", fontWeight: 600 }}>
                            Go back.
                        </button>
                    </p>
                </PanelCard>
            </PageCard>
        );
    }

    const skills    = candidateSkillsForJob[candidate.id] || candidateSkillsForJob.default;
    const resume    = candidateResumes[candidate.id]      || candidateResumes.default;
    const comps     = getCompetencyScores(candidate.score);
    const { color } = getScoreStyle(candidate.score);

    const competencyCounts = {
        strong:  comps.filter(c => c.value >= 80).length,
        partial: comps.filter(c => c.value >= 60 && c.value < 80).length,
        weak:    comps.filter(c => c.value < 60).length,
    };

    const strongest  = [...comps].sort((a, b) => b.value - a.value)[0].label;
    const weakest    = [...comps].sort((a, b) => a.value - b.value)[0].label;
    const skillTotal = skills.strong.length + skills.partial.length + skills.missing.length;

    return (
        <PageCard breadcrumb={`Jobs / ${job.title} / Candidate / ${candidate.userName}`} title="Candidate Detail">
            <div className="layout">

                {/* ── Left — profile card ───────────────────────────────── */}
                <div className="left">
                    <PanelCard>
                        <div className="profile">
                            <div className="profile-avatar" style={{ background: candidate.bg, color: candidate.color }}>
                                {getInitials(candidate.userName)}
                            </div>
                            <div className="profile-name">{candidate.userName}</div>
                            <div className="profile-headline">{candidate.headline}</div>

                            <div className="profile-score" style={{ background: candidate.bg, color }}>
                                {candidate.score}% match
                            </div>

                            <div className="profile-divider" />

                            <div className="profile-stats">
                                <div className="profile-stat">
                                    <span className="profile-stat-key">Skills matched</span>
                                    <span className="profile-stat-val">{skills.strong.length} of {skillTotal}</span>
                                </div>
                                <div className="profile-stat">
                                    <span className="profile-stat-key">Strongest area</span>
                                    <span className="profile-stat-val">{strongest}</span>
                                </div>
                                <div className="profile-stat">
                                    <span className="profile-stat-key">Gap area</span>
                                    <span className="profile-stat-val">{weakest}</span>
                                </div>
                            </div>

                            <div className="profile-divider" />

                            <div className="profile-skills-label">Top skills</div>
                            <div className="profile-skills">
                                {candidate.skills.map(s => (
                                    <span key={s} className="profile-skill">{s}</span>
                                ))}
                            </div>

                            <div className="profile-divider" />

                            <div className="resume-section">
                                <div className="section-label">Resume</div>
                                <div className="resume-row">
                                    <div className="resume-icon">
                                        <FileIcon />
                                    </div>
                                    <div className="resume-body">
                                        <div className="resume-name">{resume.fileName}</div>
                                        <div className="resume-meta">{resume.pages} page{resume.pages > 1 ? "s" : ""} · PDF</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="view-resume-btn"
                                    onClick={() => setShowResume(true)}
                                >
                                    <i className="ti ti-eye" aria-hidden="true" /> View resume
                                </button>
                            </div>

                            <div className="profile-divider" />

                            <a
                                href={`mailto:?subject=Re: ${encodeURIComponent(candidate.userName)} — job application`}
                                className="contact-btn"
                            >
                                <EmailIcon />
                                Contact candidate
                            </a>

                            <button type="button" className="back-btn" onClick={goBack}>
                                ← Back to candidates
                            </button>
                        </div>
                    </PanelCard>
                </div>

                {/* ── Right — match data ────────────────────────────────── */}
                <div className="right">
                    <ScorePanel score={candidate.score} counts={competencyCounts} />
                    <CompetencyPanel competencies={comps} />
                    <SkillsPanel skills={skills} />
                </div>
            </div>

            {showResume && (
                <ResumeModal
                    resume={resume}
                    candidateName={candidate.userName}
                    onClose={() => setShowResume(false)}
                />
            )}
        </PageCard>
    );
}

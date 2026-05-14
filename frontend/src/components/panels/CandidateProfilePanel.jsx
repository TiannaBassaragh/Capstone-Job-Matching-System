import { PanelCard } from "../cards";
import { FileIcon, EmailIcon } from "../icons";
import { getInitials, getScoreStyle } from "../../utils";
import "./CandidateProfilePanel.css";

const NA = "N/A";

/**
 * CandidateProfilePanel
 * Left-rail profile card on the recruiter's CandidateDetailPage. Shows avatar,
 * name, headline (tier), score badge, key stats, tech skills, resume actions,
 * contact button, back button, and skill breakdown.
 *
 * Props:
 *   name              — string
 *   tier              — string | null (e.g. "strong_fit")
 *   score             — number (0–100)
 *   bg, color         — avatar background + foreground (from candidate row)
 *   techKeys          — string[] (tech skill chips)
 *   skills            — { strong, partial, missing }
 *   strongest, weakest — labels for "X area"
 *   email             — optional candidate email (uses mailto:?)
 *   candidateId       — for resume filename
 *   onViewResume      — () => void
 *   onDownloadResume  — () => void
 *   onBack            — () => void
 */
export default function CandidateProfilePanel({
    name,
    tier,
    score,
    bg,
    color,
    avatar = null,
    techKeys = [],
    metCount,
    scoredCount,
    strongest,
    weakest,
    email,
    candidateId,
    onViewResume,
    onDownloadResume,
    onBack,
}) {
    const { color: pctColor } = getScoreStyle(score);

    return (
        <PanelCard>
            <div className="cprofile">

                <div className="cprofile-avatar" style={{ background: bg, color }}>
                    {avatar
                        ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                        : getInitials(name)
                    }
                </div>
                <div className="cprofile-name">{name}</div>
                {tier && <div className="cprofile-headline">{tier.replace(/_/g, " ")}</div>}

                <div className="cprofile-score" style={{ background: bg, color: pctColor }}>
                    {score > 0 ? `${score}% match` : "Pending match"}
                </div>

                <div className="cprofile-divider" />

                <div className="cprofile-stats">
                    <Stat label="Requirements met" value={scoredCount > 0 ? `${metCount} of ${scoredCount}` : NA} />
                    <Stat label="Strongest area" value={strongest || NA} />
                    <Stat label="Weakest area" value={weakest || NA} />
                </div>

                {techKeys.length > 0 && (
                    <>
                        <div className="cprofile-divider" />
                        <div className="cprofile-skills-label">Tech skills</div>
                        <div className="cprofile-skills">
                            {techKeys.slice(0, 8).map(s => (
                                <span key={s} className="cprofile-skill">{s}</span>
                            ))}
                        </div>
                    </>
                )}

                <div className="cprofile-divider" />

                <div className="cprofile-resume">
                    <div className="section-label">Resume</div>
                    <div className="cprofile-resume-row">
                        <div className="cprofile-resume-icon"><FileIcon /></div>
                        <div className="cprofile-resume-body">
                            <div className="cprofile-resume-name">candidate_{candidateId}_resume.pdf</div>
                            <div className="cprofile-resume-meta">PDF</div>
                        </div>
                    </div>
                    <button type="button" className="cprofile-resume-btn" onClick={onViewResume}>
                        View resume
                    </button>
                    {onDownloadResume && (
                        <button
                            type="button"
                            className="cprofile-resume-btn"
                            style={{ marginTop: 6 }}
                            onClick={onDownloadResume}
                        >
                            Download resume
                        </button>
                    )}
                </div>

                <div className="cprofile-divider" />

                {email ? (
                <a
                    href={`mailto:${email}?subject=Re: ${encodeURIComponent(name)} — job application`}
                    className="cprofile-contact"
                >
                    <EmailIcon />
                    Contact candidate
                </a>
            ) : (
                <div className="cprofile-contact cprofile-contact--disabled">
                    <EmailIcon />
                    Contact candidate — N/A
                </div>
            )}

                {onBack && (
                    <button type="button" className="cprofile-back" onClick={onBack}>
                        ← Back to candidates
                    </button>
                )}

            </div>
        </PanelCard>
    );
}

function Stat({ label, value }) {
    return (
        <div className="cprofile-stat">
            <span className="cprofile-stat-key">{label}</span>
            <span className="cprofile-stat-val">{value}</span>
        </div>
    );
}

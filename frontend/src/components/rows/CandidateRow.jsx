import { useState } from "react";
import { getInitials, getScoreStyle } from "../../utils";
import { jobsService } from "../../lib/jobsService";
import "./CandidateRow.css";

export default function CandidateRow({ candidate, onClick, onShortlistChange }) {
    const [shortlisted, setShortlisted] = useState(candidate.shortlisted ?? false);
    const [saving, setSaving] = useState(false);
    const { color, barColor } = getScoreStyle(candidate.score);

    const handleShortlist = async (e) => {
        e.stopPropagation();
        const next = !shortlisted;
        setShortlisted(next);
        setSaving(true);
        try {
            await jobsService.setShortlisted(candidate.jobId, candidate.id, next);
            onShortlistChange?.(candidate.id, next);
        } catch (err) {
            console.error("Shortlist error:", err);
            setShortlisted(!next);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="candidate-row"
            onClick={() => { if (onClick) onClick(candidate); }}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onClick?.(candidate); }}
        >
            <div className="candidate-row-icon" style={{ background: candidate.bg, color: candidate.color }}>
                {candidate.avatar
                    ? <img src={candidate.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                    : getInitials(candidate.userName)
                }
            </div>
            <div className="candidate-row-body">
                <div className="candidate-row-name">
                    {candidate.userName}
                    {candidate.isNew && <span className="candidate-row-new">New</span>}
                </div>
                <div className="candidate-row-headline">{candidate.headline}</div>
                <div className="candidate-row-skills">
                    {candidate.skills.map(s => <span key={s} className="candidate-row-skill">{s}</span>)}
                </div>
            </div>
            <button
                type="button"
                className={`shortlist-btn${shortlisted ? " shortlist-btn--active" : ""}`}
                onClick={handleShortlist}
                disabled={saving}
                aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
            >
                {shortlisted ? "⭐ Shortlisted" : "☆ Shortlist"}
            </button>
            <div className="candidate-row-score">
                <div className="candidate-row-pct" style={{ color }}>{candidate.score}%</div>
                <div className="candidate-row-bar">
                    <div className="candidate-row-fill" style={{ width: `${candidate.score}%`, background: barColor }} />
                </div>
            </div>
        </div>
    );
}

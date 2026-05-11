import { useState } from "react";
import { getInitials, getScoreStyle } from "../../utils";
import "./CandidateRow.css";

export default function CandidateRow({ candidate, onClick }) {
    const [shortlisted, setShortlisted] = useState(candidate.shortlisted);
    const { color, barColor } = getScoreStyle(candidate.score);

    const handleShortlist = (e) => {
        e.stopPropagation();
        setShortlisted(prev => !prev);
    };

    const handleRowClick = (e) => {
        if (e.target.closest(".shortlist-btn")) return;
        if (onClick) onClick(candidate);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className="candidate-row"
            onClick={handleRowClick}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleRowClick(e); }}
        >
            <div className="candidate-row-icon" style={{ background: candidate.bg, color: candidate.color }}>
                {getInitials(candidate.userName)}
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
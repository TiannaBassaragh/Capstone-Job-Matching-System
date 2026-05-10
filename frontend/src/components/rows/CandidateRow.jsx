import { useState } from "react";
import { getInitials, getScoreStyle } from "../../utils";
import "./CandidateRow.css";

export default function CandidateRow({ candidate, onClick }) {
    const [shortlisted, setShortlisted] = useState(candidate.shortlisted);
    const { color, barColor } = getScoreStyle(candidate.score);

    const handleShortlist = (e) => {
        e.stopPropagation();
        console.log("Toggled shortlist:", candidate.userName);
        setShortlisted(prev => !prev);
    };

    return (
        <button
            type="button"
            className="candidate-row"
            onClick={() => {
                console.log("Clicked candidate:", candidate.userName);
                if (onClick) onClick(candidate);
            }}
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
        </button>
    );
}

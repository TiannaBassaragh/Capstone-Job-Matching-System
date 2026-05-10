import { getInitials, getScoreStyle } from "../../utils";
import "./MatchRow.css";

function ExpandedContent({ match, skills, onViewDetails }) {
    return (
        <div className="expanded">
            <div className="expanded-label">Skills from your resume</div>
            <div className="expanded-skills">
                {skills.strong.map(s  => <span key={s} className="skill skill--strong">{s} ✓</span>)}
                {skills.partial.map(s => <span key={s} className="skill skill--partial">{s} ~</span>)}
            </div>
            <div className="expanded-footer">
                <button
                    type="button"
                    className="details-btn"
                    onClick={() => onViewDetails(match)}
                >
                    View full match details →
                </button>
            </div>
        </div>
    );
}

export default function MatchRow({ match, skills, isExpanded, onToggle, onViewDetails }) {
    const { color, barColor } = getScoreStyle(match.score);

    return (
        <div className={`match-row${isExpanded ? " match-row--open" : ""}`}>
            <button
                type="button"
                className={`btn${isExpanded ? " btn--active" : ""}`}
                onClick={onToggle}
            >
                <div className="icon" style={{ background: match.bg, color: match.color }}>
                    {getInitials(match.userName)}
                </div>
                <div className="body">
                    <div className="title">
                        {match.title}
                        {match.isNew && <span className="new-badge">New</span>}
                    </div>
                    <div className="meta">
                        {match.userName} · {match.location} · ${match.payLow}k – ${match.payHigh}k
                    </div>
                </div>
                <div className="score">
                    <div className="score-pct" style={{ color }}>{match.score}%</div>
                    <div className="score-bar">
                        <div className="score-fill" style={{ width: `${match.score}%`, background: barColor }} />
                    </div>
                </div>
                <div className={`chevron${isExpanded ? " chevron--open" : ""}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </button>

            {isExpanded && (
                <ExpandedContent match={match} skills={skills} onViewDetails={onViewDetails} />
            )}
        </div>
    );
}

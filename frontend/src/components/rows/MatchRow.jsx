import { getInitials, getScoreStyle } from "../../utils";
import "./MatchRow.css";

const NA = "N/A";

function buildMeta(match) {
    const parts = [match.userName];
    if (match.location) parts.push(match.location);
    const pay = match.payLow != null && match.payHigh != null
        ? `$${match.payLow}k – $${match.payHigh}k`
        : null;
    if (pay) parts.push(pay);
    return parts.join(" · ");
}

function ExpandedContent({ match, skills, onViewDetails }) {
    const hasSkills = skills.strong.length > 0 || skills.partial.length > 0;
    return (
        <div className="expanded">
            <div className="expanded-label">Skills from your resume</div>
            <div className="expanded-skills">
                {hasSkills ? (
                    <>
                        {skills.strong.map(s  => <span key={s} className="skill skill--strong">{s} ✓</span>)}
                        {skills.partial.map(s => <span key={s} className="skill skill--partial">{s} ~</span>)}
                    </>
                ) : (
                    <span className="skill-empty">No skills data available for this match.</span>
                )}
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
                    <div className="meta">{buildMeta(match)}</div>
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

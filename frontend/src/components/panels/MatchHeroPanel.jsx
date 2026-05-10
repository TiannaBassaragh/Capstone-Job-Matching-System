import { PanelCard } from "../cards";
import { getInitials } from "../../utils";
import "./MatchHeroPanel.css";

export default function MatchHeroPanel({ match, onBack, backLabel = "← All matches" }) {
    return (
        <PanelCard>
            <div className="match-hero">
                <div className="match-hero-icon" style={{ background: match.bg, color: match.color }}>
                    {getInitials(match.userName)}
                </div>
                <div className="match-hero-body">
                    <div className="match-hero-title">{match.title}</div>
                    <div className="match-hero-meta">
                        {match.userName}
                        {match.location ? ` · ${match.location}` : ""}
                        {match.payLow != null && match.payHigh != null
                            ? ` · $${match.payLow}k – $${match.payHigh}k`
                            : ""}
                    </div>
                </div>
                {onBack && (
                    <button type="button" className="match-hero-back" onClick={onBack}>
                        {backLabel}
                    </button>
                )}
            </div>
        </PanelCard>
    );
}

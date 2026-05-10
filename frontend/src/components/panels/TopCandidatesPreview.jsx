import { PanelCard } from "../cards";
import { getInitials, getScoreStyle } from "../../utils";
import "./TopCandidatesPreview.css";

export default function TopCandidatesPreview({ candidates = [], onCandidateClick }) {
    const top = [...candidates].sort((a, b) => b.score - a.score).slice(0, 3);

    return (
        <PanelCard>
            <div className="section-label">Top candidates at a glance</div>
            <div className="top-list">
                {top.map(c => {
                    const { color } = getScoreStyle(c.score);
                    return (
                        <button
                            key={c.id}
                            type="button"
                            className="top-item"
                            onClick={() => {
                                console.log("Clicked top candidate:", c.userName);
                                if (onCandidateClick) onCandidateClick(c);
                            }}
                        >
                            <div className="top-item-icon" style={{ background: c.bg, color: c.color }}>
                                {getInitials(c.userName)}
                            </div>
                            <div className="top-item-body">
                                <div className="top-item-name">{c.userName}</div>
                                <div className="top-item-meta">{c.headline}</div>
                            </div>
                            <span className="top-item-score" style={{ color }}>{c.score}%</span>
                        </button>
                    );
                })}
            </div>
        </PanelCard>
    );
}

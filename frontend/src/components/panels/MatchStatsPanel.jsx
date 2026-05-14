import { PanelCard } from "../cards";
import "./MatchStatsPanel.css";

export default function MatchStatsPanel({ candidates = [] }) {
    const above80   = candidates.filter(c => c.score >= 80).length;
    const newCount  = candidates.filter(c => c.isNew).length;
    const topScore  = candidates.length > 0 ? Math.max(...candidates.map(c => c.score)) : 0;

    return (
        <PanelCard>
            <div className="section-label">Match stats</div>
            <div className="stat-grid">
                <div className="stat-cell">
                    <div className="stat-val">{candidates.length}</div>
                    <div className="stat-lbl">Total matched</div>
                </div>
                <div className="stat-cell">
                    <div className="stat-val">{newCount}</div>
                    <div className="stat-lbl">New this week</div>
                </div>
                <div className="stat-cell">
                    <div className="stat-val">{above80}</div>
                    <div className="stat-lbl">Above 80%</div>
                </div>
                <div className="stat-cell">
                    <div className="stat-val">{topScore}%</div>
                    <div className="stat-lbl">Top score</div>
                </div>
            </div>
        </PanelCard>
    );
}

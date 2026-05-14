import { PanelCard } from "../cards";
import "./MatchContextPanel.css";

export default function MatchContextPanel({ score, metCount, totalCount, strongest, weakest }) {
    return (
        <PanelCard>
            <div className="section-label">Match context</div>
            <div className="match-context-list">
                <div className="match-context-row">
                    <span className="match-context-key">Your score</span>
                    <span className="match-context-val">{score}%</span>
                </div>
                <div className="match-context-row">
                    <span className="match-context-key">Requirements met</span>
                    <span className="match-context-val">{metCount} of {totalCount}</span>
                </div>
                <div className="match-context-row">
                    <span className="match-context-key">Strongest area</span>
                    <span className="match-context-val">{strongest}</span>
                </div>
                <div className="match-context-row">
                    <span className="match-context-key">Weakest area</span>
                    <span className="match-context-val">{weakest}</span>
                </div>
            </div>
        </PanelCard>
    );
}

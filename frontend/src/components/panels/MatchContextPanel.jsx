import { PanelCard } from "../cards";
import "./MatchContextPanel.css";

/**
 * MatchContextPanel
 * Right-rail "Match context" summary on the candidate's MatchDetails page.
 *
 * Props:
 *   score      — number (0–100)
 *   skills     — { strong, partial, missing } — used for "X of Y" count
 *   strongest  — string (label of best-scoring competency)
 *   weakest    — string (label of weakest-scoring competency)
 */
export default function MatchContextPanel({ score, skills, strongest, weakest }) {
    const total = skills.strong.length + skills.partial.length + skills.missing.length;

    return (
        <PanelCard>
            <div className="section-label">Match context</div>
            <div className="match-context-list">
                <div className="match-context-row">
                    <span className="match-context-key">Your score</span>
                    <span className="match-context-val">{score}%</span>
                </div>
                <div className="match-context-row">
                    <span className="match-context-key">Skills matched</span>
                    <span className="match-context-val">
                        {skills.strong.length} of {total}
                    </span>
                </div>
                <div className="match-context-row">
                    <span className="match-context-key">Strongest area</span>
                    <span className="match-context-val">{strongest}</span>
                </div>
                <div className="match-context-row">
                    <span className="match-context-key">Gap area</span>
                    <span className="match-context-val">{weakest}</span>
                </div>
            </div>
        </PanelCard>
    );
}

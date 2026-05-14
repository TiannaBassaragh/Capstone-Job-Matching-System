import { PanelCard } from "../cards";
import { ScoreRing } from "../icons/DynamicIcons";
import "./ScorePanel.css";

export default function ScorePanel({ score, counts }) {
    const { strong, partial, weak } = counts;

    const label =
        score >= 80 ? "Strong match" :
        score >= 60 ? "Decent match" : "Partial match";

    const desc =
        score >= 80 ? "You're in the top tier of candidates for this role based on competency alignment." :
        score >= 60 ? "You meet the core requirements. A few gaps may be worth addressing." :
                      "You partially meet the requirements. Review the skill gaps below.";

    return (
        <PanelCard>
            <div className="section-label">Score at a glance</div>
            <div className="score-ring-row">
                <ScoreRing score={score} />
                <div>
                    <div className="ring-label">{label}</div>
                    <div className="ring-desc">{desc}</div>
                </div>
            </div>
            <div className="divider" />
            <div className="area-counts">
                <div className="area-stat">
                    <span className="area-value" style={{ color: "#1D6B2E" }}>{strong}</span>
                    <span className="area-label">Strong areas</span>
                </div>
                <div className="area-stat">
                    <span className="area-value" style={{ color: "#BA7517" }}>{partial}</span>
                    <span className="area-label">Partial areas</span>
                </div>
                <div className="area-stat">
                    <span className="area-value" style={{ color: "#a32d2d" }}>{weak}</span>
                    <span className="area-label">Gap areas</span>
                </div>
            </div>
        </PanelCard>
    );
}
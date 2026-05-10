import { PanelCard } from "../cards";
import { getScoreStyle } from "../../utils";
import "./CompetencyPanel.css";

export default function CompetencyPanel({ competencies }) {
    return (
        <PanelCard>
            <div className="section-label">Competency breakdown</div>
            <div className="competency-list">
                {competencies.map((c, i) => {
                    const { color, barColor } = getScoreStyle(c.value);
                    return (
                        <div key={c.key}>
                            {i > 0 && <div className="divider" />}
                            <div className="competency-row">
                                <div className="competency-header">
                                    <span className="competency-name">{c.label}</span>
                                    <span className="competency-pct" style={{ color }}>{c.value}%</span>
                                </div>
                                <div className="competency-bar">
                                    <div className="competency-fill" style={{ width: `${c.value}%`, background: barColor }} />
                                </div>
                                <div className="competency-desc">{c.desc}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </PanelCard>
    );
}
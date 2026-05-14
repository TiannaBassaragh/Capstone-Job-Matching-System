import { PanelCard } from "../cards";
import { getScoreStyle } from "../../utils";
import "./CompetencyPanel.css";

const LEGEND = [
    { color: "#22c55e", label: "Meets requirement" },
    { color: "#f59e0b", label: "Below requirement" },
    { color: "#B91C1C", label: "Not detected" },
    { color: "#9CA3AF", label: "Not required for this role" },
];

export default function CompetencyPanel({ competencies }) {
    const hasStatuses = competencies.some(c => c.status !== null && c.status !== undefined);
    return (
        <PanelCard>
            <div className="section-label">Competency breakdown</div>
            {hasStatuses && (
                <div className="competency-legend">
                    {LEGEND.map(({ color, label }) => (
                        <span key={label} className="legend-item">
                            <span className="legend-dot" style={{ background: color }} />
                            {label}
                        </span>
                    ))}
                </div>
            )}
            <div className="competency-list">
                {competencies.map((c, i) => {
                    const fallback   = getScoreStyle(c.value);
                    const color      = c.status === "met"          ? "#1D6B2E"
                                     : c.status === "gap"          ? "#BA7517"
                                     : c.status === "absent"       ? "#B91C1C"
                                     : c.status === "undetermined" ? "#9CA3AF"
                                     : c.status === null           ? "var(--muted)"
                                     : fallback.color;
                    const barColor   = c.status === "met"  ? "#22c55e"
                                     : c.status === "gap"  ? "#f59e0b"
                                     : c.status === null   ? "#9ca3af"
                                     : null;
                    const valueLabel = c.status === "absent"       ? "Not found"
                                     : c.status === "undetermined" ? "No level"
                                     : `${c.value}%`;
                    return (
                        <div key={c.key}>
                            {i > 0 && <div className="divider" />}
                            <div className="competency-row">
                                <div className="competency-header">
                                    <span className="competency-name">{c.label}</span>
                                    <span className="competency-pct" style={{ color }}>{valueLabel}</span>
                                </div>
                                <div className="competency-bar">
                                    {barColor && <div className="competency-fill" style={{ width: `${c.value}%`, background: barColor }} />}
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
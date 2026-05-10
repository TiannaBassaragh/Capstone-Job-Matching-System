import { PanelCard } from "../cards";
import "./RoleFactsPanel.css";

/**
 * RoleFactsPanel
 * Shows a list of fact rows (e.g. "Work type · Hybrid") followed by an optional
 * description paragraph. Used on both candidate's MatchDetails and recruiter's
 * OverviewSection — the two pages used to inline near-identical markup.
 *
 * Props:
 *   facts        — [{ key, value }]
 *   description  — string (optional)
 *   label        — section title (default "About the role")
 */
export default function RoleFactsPanel({ facts = [], description = "", label = "About the role" }) {
    return (
        <PanelCard>
            <div className="section-label">{label}</div>
            {facts.length > 0 && (
                <div className="role-facts">
                    {facts.map(f => (
                        <div className="role-fact-row" key={f.key}>
                            <span className="role-fact-key">{f.key}</span>
                            <span className="role-fact-val">{f.value}</span>
                        </div>
                    ))}
                </div>
            )}
            {description && (
                <p className="role-facts-description">{description}</p>
            )}
        </PanelCard>
    );
}

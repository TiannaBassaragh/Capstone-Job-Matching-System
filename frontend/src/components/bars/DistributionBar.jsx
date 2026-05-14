import "./DistributionBar.css";

export default function DistributionBar({ items, variant = "inline" }) {
    const data   = items || [];
    const strong = data.filter(i => i.score >= 80).length;
    const decent = data.filter(i => i.score >= 60 && i.score < 80).length;
    const weak   = data.filter(i => i.score < 60).length;
    const total  = data.length;
    if (total === 0) return null;

    if (variant === "inline") {
        return (
            <div className="wrapping">
                <div className="bar">
                    {strong > 0 && <div className="segment strong-segment" style={{ width: `${(strong/total)*100}%` }} />}
                    {decent > 0 && <div className="segment decent-segment" style={{ width: `${(decent/total)*100}%` }} />}
                    {weak   > 0 && <div className="segment weak-segment"   style={{ width: `${(weak/total)*100}%` }} />}
                </div>
                {strong > 0 && <span className="bar-label bar-label--strong">{strong} strong</span>}
                {decent > 0 && <><span className="separator">·</span><span className="bar-label bar-label--decent">{decent} decent</span></>}
                {weak   > 0 && <><span className="separator">·</span><span className="bar-label bar-label--weak">{weak} weak</span></>}
            </div>
        );
    }

    return (
        <div className="dist-list">
            {[
                { label: "80%+",      count: strong, color: "#22a84a", pct: strong / total },
                { label: "60 – 79%",  count: decent, color: "#EF9F27", pct: decent / total },
                { label: "Below 60%", count: weak,   color: "#E24B4A", pct: weak   / total },
            ].map(row => (
                <div key={row.label} className="list-row">
                    <span className="list-dot" style={{ background: row.color }} />
                    <span className="list-label">{row.label}</span>
                    <div className="list-track">
                        <div className="list-fill" style={{ width: `${row.pct * 100}%`, background: row.color }} />
                    </div>
                    <span className="list-count">{row.count}</span>
                </div>
            ))}
        </div>
    );
}
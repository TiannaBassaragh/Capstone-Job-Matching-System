import "./DistributionBar.css";

export default function DistributionBar({ items, variant = "inline" }) {
    const data   = items || [];
    const strong = data.filter(i => i.score >= 80).length;
    const decent = data.filter(i => i.score >= 60 && i.score < 80).length;
    const weak   = data.filter(i => i.score < 60).length;
    const total  = data.length;
    if (total === 0) return null;

    if (variant === "inline") {
        const sp = (strong / total) * 100;
        const dp = (decent / total) * 100;

        const stops = [];
        let pos = 0;
        if (strong > 0) { stops.push(`#22a84a ${pos}% ${pos + sp}%`);  pos += sp; }
        if (decent > 0) { stops.push(`#EF9F27 ${pos}% ${pos + dp}%`);  pos += dp; }
        if (weak   > 0) { stops.push(`#E24B4A ${pos}% 100%`); }
        const gradient = stops.length > 1
            ? `linear-gradient(to right, ${stops.join(", ")})`
            : (strong > 0 ? "#22a84a" : decent > 0 ? "#EF9F27" : "#E24B4A");

        return (
            <div className="wrapping">
                <div className="bar" style={{ background: gradient }} />
                {strong > 0 && <span className="bar-label bar-label--strong">{strong} strong</span>}
                {decent > 0 && <><span className="separator">·</span><span className="bar-label bar-label--decent">{decent} decent</span></>}
                {weak   > 0 && <><span className="separator">·</span><span className="bar-label bar-label--weak">{weak} weak</span></>}
            </div>
        );
    }

    return (
        <div className="dist-list">
            {[
                { label: "80%+",      count: strong, color: "#22a84a" },
                { label: "60 – 79%",  count: decent, color: "#EF9F27" },
                { label: "Below 60%", count: weak,   color: "#E24B4A" },
            ].map(row => (
                <div key={row.label} className="list-row">
                    <span className="list-dot" style={{ background: row.color }} />
                    <span className="list-label">{row.label}</span>
                    <div className="list-track">
                        {row.count > 0 && (
                            <div className="list-fill" style={{ width: `${(row.count / total) * 100}%`, background: row.color }} />
                        )}
                    </div>
                    <span className="list-count">{row.count}</span>
                </div>
            ))}
        </div>
    );
}
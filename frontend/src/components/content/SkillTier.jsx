import "./SkillTier.css";

export default function SkillTier({ tier }) {
    const config = {
        strong:  { label: "✓ High proficiency",    className: "tier--strong"  },
        partial: { label: "~ Moderate proficiency", className: "tier--partial" },
        low:     { label: "↓ Low proficiency",      className: "tier--missing" },
        unclear: { label: "? Needs more info",      className: "tier--missing" },
        missing: { label: "✗ Required, not found",  className: "tier--missing" },
    };
    const { label, className } = config[tier];
    return <span className={`tier ${className}`}>{label}</span>;
}

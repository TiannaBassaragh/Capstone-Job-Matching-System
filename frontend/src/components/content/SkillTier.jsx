import "./SkillTier.css";

export default function SkillTier({ tier }) {
    const config = {
        strong:  { label: "✓ Strong match",       className: "tier--strong"  },
        partial: { label: "~ Partial match",       className: "tier--partial" },
        missing: { label: "✗ Not found in resume", className: "tier--missing" },
    };
    const { label, className } = config[tier];
    return <span className={`tier ${className}`}>{label}</span>;
}

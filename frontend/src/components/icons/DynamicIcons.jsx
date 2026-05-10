import { getScoreStyle } from "../../utils";

export function ScoreRing({ score }) {
    const { color } = getScoreStyle(score);
    const r      = 28;
    const circ   = 2 * Math.PI * r;
    const filled = (score / 100) * circ;

    return (
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--acc-light)" strokeWidth="6"/>
            <circle
                cx="36" cy="36" r={r} fill="none"
                stroke={color} strokeWidth="6"
                strokeDasharray={`${filled} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
            />
            <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
                {score}%
            </text>
        </svg>
    );
}
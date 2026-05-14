import Card from "./Card";
import { CardIcons } from "../icons";
import './StatsCard.css'

export default function StatsCard({
    value = "",
    label = "",
    subtext = "",
    icon = "",
    color = {
        bg: "#EEF3FD",
        stroke: "#4B7FE3",
        subtextBg: "#EEF3FD",
        subtextText: "#1D3E9E",
    }, 
}) {        
    return (
        <Card className="stats-card">
            <div className="stats-icon" style={{ background: color.bg }}>
                {CardIcons[icon]?.(color.stroke)}
            </div>

            <div className="stats-value">{value}</div>
            <div className="stats-label">{label}</div>
            <div className="stats-subtext" style={{ background: color.subtextBg, color: color.subtextText }}>
                {subtext}
            </div>
        </Card>
    );
}
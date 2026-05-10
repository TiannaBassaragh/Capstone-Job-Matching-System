import { PanelCard } from "../cards";
import { SkillTier } from "../content";
import "./SkillsPanel.css";

export default function SkillsPanel({ skills }) {
    return (
        <PanelCard>
            <div className="section-label">Skills matched from your resume</div>
            <div className="skills">
                {skills.strong.length > 0 && (
                    <div className="skill-group">
                        <SkillTier tier="strong" />
                        <div className="tags">
                            {skills.strong.map(s => <span key={s} className="tag">{s}</span>)}
                        </div>
                    </div>
                )}
                {skills.partial.length > 0 && (
                    <>
                        <div className="divider" />
                        <div className="skill-group">
                            <SkillTier tier="partial" />
                            <div className="tags">
                                {skills.partial.map(s => <span key={s} className="tag">{s}</span>)}
                            </div>
                        </div>
                    </>
                )}
                {skills.missing.length > 0 && (
                    <>
                        <div className="divider" />
                        <div className="skill-group">
                            <SkillTier tier="missing" />
                            <div className="tags">
                                {skills.missing.map(s => <span key={s} className="tag">{s}</span>)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </PanelCard>
    );
}

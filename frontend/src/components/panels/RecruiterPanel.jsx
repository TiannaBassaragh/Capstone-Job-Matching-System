import { PanelCard } from "../cards";
import { EmailIcon } from "../icons";
import { getInitials } from "../../utils";
import "./RecruiterPanel.css";

export default function RecruiterPanel({ recruiter, jobTitle }) {
    return (
        <PanelCard>
            <div className="section-label">Contact recruiter</div>
            <div className="recruiter">
                <div className="avatar">{getInitials(recruiter.userName)}</div>
                <div>
                    <div className="recruiter-name">{recruiter.userName}</div>
                    <div className="recruiter-title">{recruiter.title}</div>
                </div>
            </div>
            <a
                href={`mailto:${recruiter.email}?subject=Interest in ${encodeURIComponent(jobTitle)} role`}
                className="email-btn"
            >
                <EmailIcon />
                {recruiter.email}
            </a>
            <p className="email-note">Opens your email client with a pre-filled subject line.</p>
        </PanelCard>
    );
}

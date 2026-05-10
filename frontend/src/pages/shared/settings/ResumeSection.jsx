import { PanelCard, FileIcon, UploadArrowIcon } from "../../../components";
import { useAuth } from "../../../context/AuthContext";
import "./SettingsSection.css";

const candidateFile = {
    name: "alex_johnson_resume_v3.pdf",
    date: "Uploaded Mar 12, 2026",
};

export default function ResumeSection() {
    const { auth } = useAuth();
    const isCandidate = auth.userType === "candidate";

    const handleUpload = () => {
        console.log("Clicked: upload file");
    };

    return (
        <div className="settings-section">

            <PanelCard>
                <div className="section-label">
                    {isCandidate ? "My resume" : "Job description"}
                </div>
                <p className="section-desc">
                    {isCandidate
                        ? "Your active resume is used to generate match scores against job postings."
                        : "Upload a job description to generate candidate match scores."
                    }
                </p>

                {isCandidate && (
                    <div className="file-row">
                        <div className="file-icon-wrap">
                            <FileIcon />
                        </div>
                        <div className="file-body">
                            <div className="file-name">{candidateFile.name}</div>
                            <div className="file-date">{candidateFile.date}</div>
                        </div>
                        <span className="file-badge">Active</span>
                    </div>
                )}

                <button type="button" className="upload-zone" onClick={handleUpload}>
                    <div className="upload-icon">
                        <UploadArrowIcon />
                    </div>
                    <div className="upload-title">
                        {isCandidate ? "Upload new resume" : "Upload job description"}
                    </div>
                    <div className="upload-sub">PDF or DOCX · drag & drop or click</div>
                </button>
            </PanelCard>

        </div>
    );
}

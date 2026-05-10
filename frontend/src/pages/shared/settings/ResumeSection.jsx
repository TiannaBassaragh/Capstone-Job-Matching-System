import { useState, useEffect, useRef } from "react";
import { PanelCard, FileIcon, UploadArrowIcon } from "../../../components";
import { useAuth } from "../../../context/AuthContext";
import { matchesService } from "../../../lib/matchesService";
import "./SettingsSection.css";

export default function ResumeSection() {
    const { auth } = useAuth();
    const isCandidate = auth.userType === "applicant";
    const fileInputRef = useRef(null);

    const [resume,    setResume]    = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [uploading, setUploading] = useState(false);
    const [status,    setStatus]    = useState(null);

    // Load current resume on mount
    useEffect(() => {
        if (!isCandidate) { setLoading(false); return; }
        matchesService.getMyResume()
            .then(setResume)
            .catch(() => setResume(null))
            .finally(() => setLoading(false));
    }, [isCandidate]);

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setStatus(null);
        try {
            await matchesService.uploadResume(file);
            // Re-fetch to get the new metadata
            const updated = await matchesService.getMyResume();
            setResume(updated);
            setStatus({ type: "success", msg: "Resume uploaded. Matching will begin shortly." });
        } catch (err) {
            setStatus({ type: "error", msg: err.message || "Upload failed." });
        } finally {
            setUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
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

                {status && (
                    <div className={`field-status field-status--${status.type}`}>
                        {status.msg}
                    </div>
                )}

                {isCandidate && !loading && resume && (
                    <div className="file-row">
                        <div className="file-icon-wrap">
                            <FileIcon />
                        </div>
                        <div className="file-body">
                            <div className="file-name">{resume.fileName}</div>
                            <div className="file-date">Uploaded {resume.uploadDate}</div>
                        </div>
                        <span className="file-badge">Active</span>
                    </div>
                )}

                {loading ? (
                    <p className="section-desc" style={{ color: "var(--muted)" }}>Loading…</p>
                ) : (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            className="upload-zone"
                            onClick={handleClick}
                            disabled={uploading}
                        >
                            <div className="upload-icon">
                                <UploadArrowIcon />
                            </div>
                            <div className="upload-title">
                                {uploading
                                    ? "Uploading…"
                                    : isCandidate
                                        ? "Upload new resume"
                                        : "Upload job description"
                                }
                            </div>
                            <div className="upload-sub">PDF or DOCX · click to browse</div>
                        </button>
                    </>
                )}
            </PanelCard>

        </div>
    );
}

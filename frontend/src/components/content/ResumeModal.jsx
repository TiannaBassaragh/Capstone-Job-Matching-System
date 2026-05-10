import { FileIcon } from "../icons";
import "./ResumeModal.css";

function CloseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 1v8M6.5 9l-3-3M6.5 9l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 11h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
    );
}

export default function ResumeModal({ resume, candidateName, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <FileIcon />
                        <span>{resume.fileName}</span>
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="modal-download"
                            onClick={() => console.log("Download:", resume.fileName)}
                        >
                            <DownloadIcon /> Download
                        </button>
                        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="pdf-preview">
                        <div className="pdf-page">
                            <div className="pdf-page-header">
                                <div className="pdf-name-block" />
                                <div className="pdf-contact-block" />
                            </div>
                            <div className="pdf-section-title" />
                            <div className="pdf-line" style={{ width: "90%" }} />
                            <div className="pdf-line" style={{ width: "75%" }} />
                            <div className="pdf-line" style={{ width: "85%" }} />
                            <div className="pdf-section-title" style={{ marginTop: 16 }} />
                            <div className="pdf-line" style={{ width: "80%" }} />
                            <div className="pdf-line" style={{ width: "95%" }} />
                            <div className="pdf-line" style={{ width: "60%" }} />
                            <div className="pdf-section-title" style={{ marginTop: 16 }} />
                            <div className="pdf-line" style={{ width: "70%" }} />
                            <div className="pdf-line" style={{ width: "88%" }} />
                        </div>
                        <div className="pdf-meta">
                            {resume.pages} page{resume.pages > 1 ? "s" : ""} · PDF · {candidateName}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

export default function ResumeModal({ resume, candidateName, text, onDownload, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <FileIcon />
                        <span>{resume.fileName}</span>
                    </div>
                    <div className="modal-actions">
                        {onDownload && (
                            <button type="button" className="modal-download" onClick={onDownload}>
                                <DownloadIcon /> Download PDF
                            </button>
                        )}
                        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>
                </div>
                <div className="modal-body">
                    {text
                        ? <pre className="resume-text">{text}</pre>
                        : <p className="resume-text-empty">Resume text not available.</p>
                    }
                </div>
            </div>
        </div>
    );
}

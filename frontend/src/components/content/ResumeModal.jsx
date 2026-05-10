import { FileIcon } from "../icons";
import "./ResumeModal.css";

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
                            onClick={() => console.log("Clicked: download resume", resume.fileName)}
                        >
                            <i className="ti ti-download" aria-hidden="true" /> Download
                        </button>
                        <button type="button" className="modal-close" onClick={onClose}>
                            <i className="ti ti-x" aria-hidden="true" />
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

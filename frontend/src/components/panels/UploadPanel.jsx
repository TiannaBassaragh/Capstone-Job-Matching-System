import { FileIcon, UploadArrowIcon } from '../icons';
import { PanelCard } from "../cards";
import "./UploadPanel.css";

export default function UploadPanel({
    userType = "applicant",
    currentFileName = "",
    currentFileDate = "",
    onUploadClick,
    onDeleteResume,
}) {
    const hasCurrentFile = Boolean(currentFileName && currentFileDate);

    const panelTitle = {
        applicant: "My resume",
        recruiter: "Job description",
    };
    
    const uploadTitle = {
        applicant: "Upload new resume",
        recruiter: "Post a new job description",
    };

    return (
        <PanelCard title={panelTitle[userType]}>
            {hasCurrentFile && (
                <div className="upload-panel-current-file">
                    <div className="upload-panel-current-file-icon">
                        <FileIcon />
                    </div>

                    <div className="upload-panel-current-file-text">
                        <div className="upload-panel-current-file-name">
                            {currentFileName}
                        </div>
                        <div className="upload-panel-current-file-date">
                            {currentFileDate}
                        </div>
                    </div>
                    {onDeleteResume && (
                        <button
                            type="button"
                            className="upload-panel-delete"
                            onClick={onDeleteResume}
                            aria-label="Delete resume"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            <button 
                type="button" 
                className="upload-panel-dropzone"
                onClick={onUploadClick}
            >
                <div className="upload-panel-dropzone-icon">
                    <UploadArrowIcon />
                </div>

                <div className="upload-panel-dropzone-title">
                    {uploadTitle[userType]}
                </div>
                <div className="upload-panel-dropzone-subtext">
                    PDF or DOCX · drag & drop or click
                </div>
            </button>
        </PanelCard>
    );
}
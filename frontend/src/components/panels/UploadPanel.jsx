import { FileIcon, UploadArrowIcon } from '../icons';
import { PanelCard } from "../cards";
import "./UploadPanel.css";

export default function UploadPanel({ 
    userType = "candidate",
    currentFileName = "",
    currentFileDate = "",
    onUploadClick,
}) {
    const hasCurrentFile = Boolean(currentFileName && currentFileDate);

    const panelTitle = {
        candidate: "My resume",
        employer: "Job description",
    };
    
    const uploadTitle = {
        candidate: "Upload new resume",
        employer: "Post a new job description",
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
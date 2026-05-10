import { useState } from "react";
import { UploadArrowIcon } from "../icons";
import "./UploadZone.css";

export default function UploadZone({ title = "Upload file", hint = "PDF or DOCX · drag & drop or click", onFileChange, accept = ".pdf,.docx" }) {
    const [file, setFile]         = useState(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = (f) => {
        setFile(f);
        if (onFileChange) onFileChange(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFile(dropped);
    };

    const handleRemove = () => {
        setFile(null);
        if (onFileChange) onFileChange(null);
    };

    return (
        <div
            className={`upload-zone${dragging ? " upload-zone--dragging" : ""}${file ? " upload-zone--filled" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            {file ? (
                <>
                    <i className="ti ti-file-text upload-zone-file-icon" aria-hidden="true" />
                    <div className="upload-zone-file-name">{file.name}</div>
                    <button type="button" className="upload-zone-remove" onClick={handleRemove}>
                        Remove
                    </button>
                </>
            ) : (
                <>
                    <div className="upload-zone-icon"><UploadArrowIcon /></div>
                    <div className="upload-zone-title">{title}</div>
                    <div className="upload-zone-hint">{hint}</div>
                    <label className="upload-zone-browse">
                        Browse files
                        <input
                            type="file"
                            accept={accept}
                            style={{ display: "none" }}
                            onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
                        />
                    </label>
                </>
            )}
        </div>
    );
}

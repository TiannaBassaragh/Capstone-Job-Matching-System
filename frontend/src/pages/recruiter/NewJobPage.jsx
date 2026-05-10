import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageCard, PanelCard } from "../../components/cards";
import { UploadZone } from "../../components/content";
import JobForm from "./JobForm";
import "./NewJobPage.css";

const defaultForm = {
    title:       "",
    location:    "Remote",
    workType:    "Full-time",
    payLow:      "",
    payHigh:     "",
    experience:  "3–5 years",
    description: "",
};

export default function NewJobPage() {
    const navigate   = useNavigate();
    const [form, setForm]   = useState(defaultForm);
    const [file, setFile]   = useState(null);

    const handleSubmit = () => {
        console.log("Submitting new job:", form, file);
        navigate("/jobs");
    };

    return (
        <PageCard breadcrumb="Jobs / Post new job" title="Post a new job">
            <div className="new-job-layout">

                <div className="new-job-left">
                    <JobForm form={form} onChange={setForm} />
                </div>

                <div className="new-job-right">

                    <PanelCard>
                        <div className="section-label">Upload job description</div>
                        <p className="upload-hint">
                            Upload a PDF or DOCX and we'll extract the job details automatically.
                            You can also fill in the form manually on the left.
                        </p>
                        <UploadZone
                            title="Drop your job description here"
                            hint="PDF or DOCX · or click to browse"
                            onFileChange={setFile}
                        />
                    </PanelCard>

                    <PanelCard>
                        <div className="section-label">Ready to post?</div>
                        <p className="submit-hint">
                            Once posted, candidates will be matched against this role automatically.
                        </p>
                        <button
                            type="button"
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={!form.title}
                        >
                            Post job
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate("/jobs")}
                        >
                            Cancel
                        </button>
                    </PanelCard>

                </div>
            </div>
        </PageCard>
    );
}

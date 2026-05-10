import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { PageCard, PanelCard } from "../../components/cards";
import { UploadZone } from "../../components/content";
import { jobsService } from "../../lib/jobsService";
import JobForm from "./JobForm";
import "./NewJobPage.css";

const defaultForm = {
    title:       "",
    location:    "Remote",
    workType:    "Full-time",
    payLow:      "",
    payHigh:     "",
    experience:  "3-5 years",
    description: "",
};

export default function NewJobPage() {
    const navigate         = useNavigate();
    const location         = useLocation();
    const [params]         = useSearchParams();
    const editJobId        = params.get("edit");
    const isEditing        = Boolean(editJobId);
    const jobFromState     = location.state?.job;

    const [form, setForm]   = useState(defaultForm);
    const [file, setFile]   = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState("");

    useEffect(() => {
        if (!isEditing) return;

        if (jobFromState) {
            setForm({
                title:       jobFromState.title       || "",
                description: jobFromState.description || "",
                location:    jobFromState.location    || "Remote",
                workType:    jobFromState.workType    || "Full-time",
                payLow:      jobFromState.payLow      || "",
                payHigh:     jobFromState.payHigh     || "",
                experience:  jobFromState.experience  || "3-5 years",
            });
            return;
        }

        jobsService.getJob(editJobId)
            .then(j => setForm({
                title:       j.title       || "",
                description: j.description || "",
                location:    j.location    || "Remote",
                workType:    j.workType    || "Full-time",
                payLow:      j.payLow      || "",
                payHigh:     j.payHigh     || "",
                experience:  j.experience  || "3-5 years",
            }))
            .catch(err => setError(err.message || "Failed to load job."));
    }, [editJobId, isEditing, jobFromState]);

    const handleSubmit = async () => {
        if (!form.title) return;
        setSaving(true);
        setError("");
        try {
            if (isEditing) {
                await jobsService.updateJob(editJobId, {
                    title:       form.title,
                    description: form.description,
                });
                navigate(`/jobs/${editJobId}`);
            } else {
                await jobsService.createJob({
                    title:       form.title,
                    description: form.description,
                });
                navigate("/jobs");
            }
        } catch (err) {
            setError(err.message || "Failed to save job.");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumb = isEditing ? "Jobs / Edit job" : "Jobs / Post new job";
    const title      = isEditing ? "Edit job posting" : "Post a new job";

    return (
        <PageCard breadcrumb={breadcrumb} title={title}>
            <div className="new-job-layout">

                <div className="new-job-left">
                    <JobForm form={form} onChange={setForm} />
                </div>

                <div className="new-job-right">

                    {!isEditing && (
                        <PanelCard>
                            <div className="section-label">Upload job description</div>
                            <p className="upload-hint">
                                Upload a PDF or DOCX and we'll extract the job details automatically.
                                You can also fill in the form on the left.
                            </p>
                            <UploadZone
                                title="Drop your job description here"
                                hint="PDF or DOCX, or click to browse"
                                onFileChange={setFile}
                            />
                        </PanelCard>
                    )}

                    <PanelCard>
                        <div className="section-label">
                            {isEditing ? "Save changes?" : "Ready to post?"}
                        </div>
                        <p className="submit-hint">
                            {isEditing
                                ? "Candidates will be re-matched against the updated description."
                                : "Once posted, candidates will be matched against this role automatically."
                            }
                        </p>

                        {error && <p className="form-error">{error}</p>}

                        <button
                            type="button"
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={!form.title || saving}
                        >
                            {saving
                                ? (isEditing ? "Saving..." : "Posting...")
                                : (isEditing ? "Save changes" : "Post job")
                            }
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate(isEditing ? `/jobs/${editJobId}` : "/jobs")}
                        >
                            Cancel
                        </button>
                    </PanelCard>

                </div>
            </div>
        </PageCard>
    );
}

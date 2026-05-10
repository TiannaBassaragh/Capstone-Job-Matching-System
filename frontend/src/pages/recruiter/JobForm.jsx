import { PanelCard } from "../../components/cards";
import "./JobForm.css";

const workTypeOptions   = ["Full-time", "Part-time", "Contract", "Internship"];
const locationOptions   = ["Remote", "Hybrid", "On-site"];
const experienceOptions = ["0–1 years", "1–3 years", "3–5 years", "5–8 years", "8+ years"];

export default function JobForm({ form, onChange }) {
    const set = (key, val) => onChange({ ...form, [key]: val });

    return (
        <PanelCard>
            <div className="section-label">Job details</div>

            <div className="field">
                <label className="field-label" htmlFor="job-title">Job title</label>
                <input
                    id="job-title"
                    type="text"
                    className="field-input"
                    placeholder="e.g. Senior Backend Engineer"
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                />
            </div>

            <div className="field-row">
                <div className="field">
                    <label className="field-label" htmlFor="job-location">Location</label>
                    <select
                        id="job-location"
                        className="field-select"
                        value={form.location}
                        onChange={e => set("location", e.target.value)}
                    >
                        {locationOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label className="field-label" htmlFor="job-worktype">Work type</label>
                    <select
                        id="job-worktype"
                        className="field-select"
                        value={form.workType}
                        onChange={e => set("workType", e.target.value)}
                    >
                        {workTypeOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
            </div>

            <div className="field-row">
                <div className="field">
                    <label className="field-label" htmlFor="job-pay-low">Salary low (k)</label>
                    <input
                        id="job-pay-low"
                        type="number"
                        className="field-input"
                        placeholder="e.g. 100"
                        value={form.payLow}
                        onChange={e => set("payLow", e.target.value)}
                    />
                </div>
                <div className="field">
                    <label className="field-label" htmlFor="job-pay-high">Salary high (k)</label>
                    <input
                        id="job-pay-high"
                        type="number"
                        className="field-input"
                        placeholder="e.g. 140"
                        value={form.payHigh}
                        onChange={e => set("payHigh", e.target.value)}
                    />
                </div>
            </div>

            <div className="field">
                <label className="field-label" htmlFor="job-exp">Experience required</label>
                <select
                    id="job-exp"
                    className="field-select"
                    value={form.experience}
                    onChange={e => set("experience", e.target.value)}
                >
                    {experienceOptions.map(o => <option key={o}>{o}</option>)}
                </select>
            </div>

            <div className="field">
                <label className="field-label" htmlFor="job-desc">Job description</label>
                <textarea
                    id="job-desc"
                    className="field-textarea"
                    placeholder="Describe the role, responsibilities, and what you're looking for…"
                    rows={6}
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                />
            </div>
        </PanelCard>
    );
}

// jobsService.js
import { api } from "./api";
import { mapJobs, mapJob, mapCandidateRankings, mapCompetencies } from "./mappers";

export const jobsService = {

    // GET /jobs/
    // Returns all jobs for the logged-in employer
    getMyJobs: async () => {
        const data = await api.get("/jobs/");
        return mapJobs(data);
    },

    // GET /jobs/:jobId
    getJob: async (jobId) => {
        const data = await api.get(`/jobs/${jobId}`);
        return mapJob(data);
    },

    // POST /jobs/
    // Creates a new job posting
    createJob: async ({ title, description, location, workType, payLow, payHigh, experience, expiresAt }) => {
        const data = await api.post("/jobs/", {
            title, description,
            location,
            work_type:  workType   || null,
            pay_low:    payLow     ? Number(payLow)  : null,
            pay_high:   payHigh    ? Number(payHigh) : null,
            experience: experience || null,
            expires_at: expiresAt  || null,
        });
        return mapJob(data);
    },

    // PUT /jobs/:jobId
    updateJob: async (jobId, { title, description, location, workType, payLow, payHigh, experience, expiresAt }) => {
        const data = await api.put(`/jobs/${jobId}`, {
            title, description,
            location,
            work_type:  workType   || null,
            pay_low:    payLow     ? Number(payLow)  : null,
            pay_high:   payHigh    ? Number(payHigh) : null,
            experience: experience || null,
            expires_at: expiresAt  || null,
        });
        return mapJob(data);
    },

    // PATCH /jobs/:jobId/status
    setJobStatus: async (jobId, isActive) => {
        return api.patch(`/jobs/${jobId}/status`, { is_active: isActive });
    },

    // GET /jobs/:jobId/rankings
    // Returns ranked candidate list for a job
    getJobRankings: async (jobId, limit = 50) => {
        const data = await api.get(`/jobs/${jobId}/rankings?limit=${limit}`);
        return mapCandidateRankings(data);
    },

    // GET /jobs/:jobId/competencies
    // Returns the competency profile extracted from the job description
    getJobCompetencies: async (jobId) => {
        const data = await api.get(`/jobs/${jobId}/competencies`);
        return {
            jobId:        data.job_id,
            title:        data.title,
            techKeywords: data.tech_keywords ?? [],
            competencies: mapCompetencies(data.competencies),
        };
    },

    // GET /profiles/candidate/:candidateId
    // Recruiter views a candidate's full profile
    getCandidateProfile: async (candidateId) => {
        return api.get(`/profiles/candidate/${candidateId}`);
    },

    // POST /jobs/parse-description
    // Uploads a PDF or DOCX and returns the extracted text
    parseJobDescription: async (file) => {
        const body = new FormData();
        body.append("file", file);
        const data = await api.post("/jobs/parse-description", body);
        return data.text ?? "";
    },

    // GET /jobs/stats
    getEmployerStats: async () => {
        return api.get("/jobs/stats");
    },

    // DELETE /jobs/:jobId
    deleteJob: async (jobId) => {
        return api.delete(`/jobs/${jobId}`);
    },

    // POST /matches/trigger/:jobId
    triggerJobMatching: async (jobId) => {
        return api.post(`/matches/trigger/${jobId}`);
    },

    // PATCH /jobs/:jobId/rankings/:candidateId/shortlist
    setShortlisted: async (jobId, candidateId, shortlisted) => {
        return api.patch(`/jobs/${jobId}/rankings/${candidateId}/shortlist`, { shortlisted });
    },

    // GET /profiles/candidate/:candidateId/resume
    // Returns { resume_text } — the parsed resume text on file. Used by
    // recruiter to view / download a candidate's resume content.
    getCandidateResumeText: async (candidateId) => {
        const data = await api.get(`/profiles/candidate/${candidateId}/resume`);
        return data.resume_text ?? "";
    },

    // Downloads the candidate's resume as a PDF.
    downloadCandidateResume: async (candidateId) => {
        const { fetchBlob } = await import("./api");
        const blob = await fetchBlob(`/profiles/candidate/${candidateId}/resume/download`);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `candidate_${candidateId}_resume.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    },
};

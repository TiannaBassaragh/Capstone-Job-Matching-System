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
    createJob: async ({ title, description }) => {
        const data = await api.post("/jobs/", { title, description });
        return mapJob(data);
    },

    // PUT /jobs/:jobId
    updateJob: async (jobId, { title, description }) => {
        const data = await api.put(`/jobs/${jobId}`, { title, description });
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

    // DELETE /jobs/:jobId
    deleteJob: async (jobId) => {
        return api.delete(`/jobs/${jobId}`);
    },

    // POST /matches/trigger/:jobId
    triggerJobMatching: async (jobId) => {
        return api.post(`/matches/trigger/${jobId}`);
    },

    // GET /profiles/candidate/:candidateId/resume
    // Returns { resume_text } — the parsed resume text on file. Used by
    // recruiter to view / download a candidate's resume content.
    getCandidateResumeText: async (candidateId) => {
        const data = await api.get(`/profiles/candidate/${candidateId}/resume`);
        return data.resume_text ?? "";
    },

    // Downloads the resume text as a .txt file in the browser.
    downloadCandidateResume: async (candidateId) => {
        const text = await jobsService.getCandidateResumeText(candidateId);
        const blob = new Blob([text], { type: "text/plain" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `candidate_${candidateId}_resume.txt`;
        a.click();
        URL.revokeObjectURL(url);
    },
};

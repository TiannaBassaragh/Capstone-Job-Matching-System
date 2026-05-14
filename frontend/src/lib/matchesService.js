// matchesService.js
import { api, fetchBlob } from "./api";
import { mapRecommendations, mapGapProfileToSkills, mapCompetencies, mapResume } from "./mappers";

export const matchesService = {

    // GET /matches/recommendations
    // Returns top job matches for the logged-in candidate
    getRecommendations: async (limit = 50) => {
        const data = await api.get(`/matches/recommendations?limit=${limit}`);
        return mapRecommendations(data);
    },

    // GET /matches/:matchId
    // Returns a single match record
    getMatch: async (matchId) => {
        return api.get(`/matches/${matchId}`);
    },

    // GET /matches/:matchId/explain
    // Returns explanation text for a match (may be slow — LLM generated)
    getMatchExplanation: async (matchId) => {
        const data = await api.get(`/matches/${matchId}/explain`);
        return data.explanation ?? null;
    },

    // GET /users/me/competencies
    // Returns the candidate's scored competency profile
    getMyCompetencies: async () => {
        const data = await api.get("/users/me/competencies");
        return {
            candidateId:  data.candidate_id,
            techKeywords: data.tech_keywords ?? [],
            competencies: mapCompetencies(data.competencies),
        };
    },

    // POST /matches/trigger
    // Triggers background matching for the current candidate
    triggerMatching: async () => {
        return api.post("/matches/trigger");
    },

    // GET /matches/status — check if matching is running
    getMatchingStatus: async () => {
        const data = await api.get("/matches/status");
        return data.matching;
    },

    // Skills derived from a match's gapProfile
    // Not a direct API call — transforms data already fetched in getMatch
    getSkillsFromMatch: (match) => {
        return mapGapProfileToSkills(match?.gapProfile);
    },

    // GET /resumes/me
    getMyResume: async () => {
        const data = await api.get("/resumes/me");
        return mapResume(data);
    },

    // POST /resumes/
    uploadResume: async (file) => {
        const form = new FormData();
        form.append("file", file);
        return api.post("/resumes/", form);
    },

    // DELETE /resumes/{id}
    deleteResume: async (resumeId) => {
        return api.delete(`/resumes/${resumeId}`);
    },

    // GET /resumes/{id}/download — candidate downloads own resume as PDF
    downloadMyResume: async (resumeId) => {
        const blob = await fetchBlob(`/resumes/${resumeId}/download`);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `my_resume.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    },

    // GET /resumes/{id}/parse — returns the parsed text of the candidate's resume
    getMyResumeText: async (resumeId) => {
        const data = await api.get(`/resumes/${resumeId}/parse`);
        return data.text ?? "";
    },

    // PATCH /matches/:matchId/interest — candidate shows interest
    showInterest: async (matchId) => {
        return api.patch(`/matches/${matchId}/interest`, {});
    },
};

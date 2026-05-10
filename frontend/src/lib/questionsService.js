import { api } from "./api";

export const questionsService = {

    // GET /questions/mine
    // Candidates get their own competency questions.
    // Recruiters get questions about their job postings.
    // Pass resolved=true to include already-answered ones.
    getMyQuestions: async (resolved = false) => {
        const data = await api.get(`/questions/mine?resolved=${resolved}`);
        return data;
    },

    // POST /questions/{id}/answer
    // Submits a plain-language answer. The backend scores it and
    // re-runs matching in the background.
    answerQuestion: async (questionId, answerText) => {
        return api.post(`/questions/${questionId}/answer`, { answer_text: answerText });
    },
};

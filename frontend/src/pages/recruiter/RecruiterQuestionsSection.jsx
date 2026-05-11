import { useState } from "react";
import { PanelCard } from "../../components/cards";
import { useQuestions } from "../../context/QuestionsContext";
import { questionsService } from "../../lib/questionsService";
import "./RecruiterQuestionsSection.css";

const REASON_LABELS = {
    required_level_unknown: "Required level unclear",
    importance_unknown:     "Importance unclear",
    candidate_level_unknown: "Candidate level unclear",
};

function QuestionCard({ question, onAnswered }) {
    const [answer,   setAnswer]   = useState(question.answer_text || "");
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState("");

    const handleSubmit = async () => {
        if (!answer.trim()) return;
        setSaving(true);
        setError("");
        try {
            await questionsService.answerQuestion(question.question_id, answer.trim());
            onAnswered(question.question_id);
        } catch (err) {
            setError(err.message || "Failed to submit. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rq-card">
            <div className="rq-chips">
                <span className="rq-chip rq-chip--competency">{question.competency_name}</span>
                {question.reason && (
                    <span className="rq-chip rq-chip--reason">
                        {REASON_LABELS[question.reason] ?? question.reason.replace(/_/g, " ")}
                    </span>
                )}
                <span className="rq-element">Element {question.element_id}</span>
            </div>
            <p className="rq-text">{question.question_text}</p>
            {error && <p className="rq-error">{error}</p>}
            <textarea
                className="rq-textarea"
                placeholder="Answer about the job's requirements for this competency..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={3}
            />
            <div className="rq-footer">
                <button
                    type="button"
                    className="rq-submit"
                    onClick={handleSubmit}
                    disabled={!answer.trim() || saving}
                >
                    {saving ? "Submitting..." : "Submit answer"}
                </button>
            </div>
        </div>
    );
}

export default function RecruiterQuestionsSection({ jobId }) {
    const { questions, markAnswered, refresh } = useQuestions();

    const jobQuestions = questions.filter(q => q.job_id === Number(jobId));
    const open     = jobQuestions.filter(q => !q.resolved);
    const resolved = jobQuestions.filter(q =>  q.resolved);

    if (jobQuestions.length === 0) {
        return (
            <PanelCard>
                <div className="rq-empty">
                    <div className="rq-empty-title">No questions for this posting</div>
                    <div className="rq-empty-sub">
                        The system will ask if it needs clarification on a required competency level or importance weight.
                    </div>
                </div>
            </PanelCard>
        );
    }

    return (
        <div className="rq-layout">
            <PanelCard>
                <div className="rq-section-label">Open questions</div>
                {open.length === 0 ? (
                    <div className="rq-empty">
                        <div className="rq-empty-title">All caught up</div>
                        <div className="rq-empty-sub">No open questions for this posting.</div>
                    </div>
                ) : (
                    open.map(q => (
                        <QuestionCard
                            key={q.question_id}
                            question={q}
                            onAnswered={id => { markAnswered(id); refresh(); }}
                        />
                    ))
                )}
            </PanelCard>

            {resolved.length > 0 && (
                <PanelCard>
                    <div className="rq-section-label">Answered</div>
                    <div className="rq-resolved-list">
                        {resolved.map(q => (
                            <div key={q.question_id} className="rq-resolved-row">
                                <span className="rq-chip rq-chip--competency">{q.competency_name}</span>
                                <span className="rq-resolved-text">{q.question_text}</span>
                                {q.answer_text && (
                                    <span className="rq-resolved-answer">{q.answer_text}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </PanelCard>
            )}
        </div>
    );
}

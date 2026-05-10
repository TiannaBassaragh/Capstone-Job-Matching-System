import { useState } from "react";
import { PageCard, PanelCard } from "../../components/cards";
import { useQuestions } from "../../context/QuestionsContext";
import { questionsService } from "../../lib/questionsService";
import "./QuestionsPage.css";

const REASON_LABELS = {
    candidate_level_unknown: "Your level unclear",
    required_level_unknown:  "Required level unclear",
    importance_unknown:      "Importance unclear",
};

function QuestionCard({ question, onAnswered }) {
    const [answer,    setAnswer]    = useState("");
    const [saving,    setSaving]    = useState(false);
    const [error,     setError]     = useState("");

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
        <div className="q-card">
            <div className="q-chips">
                <span className="q-chip q-chip--competency">{question.competency_name}</span>
                {question.reason && (
                    <span className="q-chip q-chip--reason">
                        {REASON_LABELS[question.reason] ?? question.reason.replace(/_/g, " ")}
                    </span>
                )}
                <span className="q-element">Element {question.element_id}</span>
            </div>

            <p className="q-text">{question.question_text}</p>

            {error && <p className="q-error">{error}</p>}

            <textarea
                className="q-textarea"
                placeholder="Plain-language answer. The model scores it and updates your profile."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={4}
            />

            <div className="q-footer">
                <button
                    type="button"
                    className="q-submit"
                    onClick={handleSubmit}
                    disabled={!answer.trim() || saving}
                >
                    {saving ? "Submitting..." : "Submit answer"}
                </button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="q-empty">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="16" cy="16" r="14" stroke="var(--acc-mid)" strokeWidth="1.8"/>
                <path d="M16 22v.5" stroke="#1D9E75" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="16" cy="22.5" r=".5" fill="#1D9E75"/>
                <path d="M13 13c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.2-.7 2.2-1.8 2.7-.7.3-1.2.9-1.2 1.6" stroke="#1D9E75" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <div className="q-empty-title">All caught up</div>
            <div className="q-empty-sub">
                No open questions. The system will ask when a competency needs clarification.
            </div>
        </div>
    );
}

export default function QuestionsPage() {
    const { questions, openCount, loading, refresh, markAnswered } = useQuestions();

    const open     = questions.filter(q => !q.resolved);
    const resolved = questions.filter(q =>  q.resolved);

    return (
        <PageCard breadcrumb="Questions" title="Clarifying Questions">
            <div className="q-layout">

                <div className="q-main">
                    <PanelCard>
                        <div className="section-label">Open questions</div>

                        {loading ? (
                            <p className="q-loading">Loading...</p>
                        ) : open.length === 0 ? (
                            <EmptyState />
                        ) : (
                            open.map(q => (
                                <QuestionCard
                                    key={q.question_id}
                                    question={q}
                                    onAnswered={(id) => {
                                        markAnswered(id);
                                        refresh();
                                    }}
                                />
                            ))
                        )}
                    </PanelCard>

                    {resolved.length > 0 && (
                        <PanelCard>
                            <div className="section-label">Answered</div>
                            <div className="q-resolved-list">
                                {resolved.map(q => (
                                    <div key={q.question_id} className="q-resolved-row">
                                        <span className="q-chip q-chip--competency">{q.competency_name}</span>
                                        <span className="q-resolved-text">{q.question_text}</span>
                                        <span className="q-resolved-answer">{q.answer_text}</span>
                                    </div>
                                ))}
                            </div>
                        </PanelCard>
                    )}
                </div>

                <div className="q-sidebar">
                    <PanelCard>
                        <div className="section-label">How it works</div>
                        <p className="q-info-text">
                            The system asks when a competency score is uncertain — for example if your resume
                            mentions a skill but doesn't show enough depth to rate it.
                        </p>
                        <div className="q-info-points">
                            <div className="q-info-point">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                    <path d="M2 7l3.5 3.5L12 3" stroke="#1D9E75" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Answer in plain language. The model interprets and updates your score.
                            </div>
                            <div className="q-info-point">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                    <path d="M7 1v5l3 2" stroke="#1D9E75" strokeWidth="1.4" strokeLinecap="round"/>
                                    <circle cx="7" cy="8" r="5.5" stroke="#1D9E75" strokeWidth="1.4"/>
                                </svg>
                                Matching re-runs automatically after each answer.
                            </div>
                        </div>
                    </PanelCard>

                    <PanelCard>
                        <div className="section-label">Inbox</div>
                        <div className="q-stats">
                            <div className="q-stat">
                                <span className="q-stat-label">Open</span>
                                <span className="q-stat-value">{openCount}</span>
                            </div>
                            <div className="q-stat">
                                <span className="q-stat-label">Answered</span>
                                <span className="q-stat-value q-stat-value--green">{resolved.length}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="q-refresh"
                            onClick={refresh}
                        >
                            Refresh
                        </button>
                    </PanelCard>
                </div>
            </div>
        </PageCard>
    );
}

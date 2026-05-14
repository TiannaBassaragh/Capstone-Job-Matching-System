import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { questionsService } from "../lib/questionsService";

const QuestionsContext = createContext(null);

export function QuestionsProvider({ children }) {
    const { auth } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading]     = useState(false);

    const openCount = questions.filter(q => !q.resolved).length;

    const fetch = useCallback(async () => {
        if (!auth?.loggedIn) return;
        setLoading(true);
        try {
            const data = await questionsService.getMyQuestions(false);
            setQuestions(data);
        } catch {
            // silently fail -- user may not have questions yet
        } finally {
            setLoading(false);
        }
    }, [auth?.loggedIn]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    // Called after a successful answer so the UI updates without a round-trip
    const markAnswered = useCallback((questionId) => {
        setQuestions(prev =>
            prev.map(q => q.question_id === questionId ? { ...q, resolved: true } : q)
        );
    }, []);

    return (
        <QuestionsContext.Provider value={{ questions, openCount, loading, refresh: fetch, markAnswered }}>
            {children}
        </QuestionsContext.Provider>
    );
}

export function useQuestions() {
    return useContext(QuestionsContext);
}

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { matchesService } from "../lib/matchesService";
import { useAuth } from "./AuthContext";

const MatchingContext = createContext(null);

const POLL_INTERVAL = 3000;

export function MatchingProvider({ children }) {
    const { auth } = useAuth();
    const [matching, setMatching] = useState(false);
    const intervalRef = useRef(null);
    const onCompleteRef = useRef(null);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const poll = useCallback(async () => {
        if (!auth.loggedIn) return;
        try {
            const isMatching = await matchesService.getMatchingStatus();
            setMatching(isMatching);
            if (!isMatching && intervalRef.current) {
                stopPolling();
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                    onCompleteRef.current = null;
                }
            }
        } catch {
            // ignore — non-critical
        }
    }, [auth.loggedIn, stopPolling]);

    const startPolling = useCallback((onComplete) => {
        setMatching(true);
        onCompleteRef.current = onComplete ?? null;
        stopPolling();
        intervalRef.current = setInterval(poll, POLL_INTERVAL);
    }, [poll, stopPolling]);

    useEffect(() => {
        return stopPolling;
    }, [stopPolling]);

    return (
        <MatchingContext.Provider value={{ matching, startPolling, stopPolling }}>
            {children}
        </MatchingContext.Provider>
    );
}

export function useMatching() {
    return useContext(MatchingContext);
}

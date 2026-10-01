import { useCallback, useEffect, useMemo, useState } from "react";
import { InterviewContext } from "./InterviewContext";

const RESUME_KEY = "mockInterviewer.resume";
const LAST_RESULT_KEY = "mockInterviewer.lastResultId";

function readResume() {
    try {
        return JSON.parse(sessionStorage.getItem(RESUME_KEY)) || null;
    } catch {
        return null;
    }
}

function readLastResult() {
    try {
        return localStorage.getItem(LAST_RESULT_KEY);
    } catch {
        return null;
    }
}

/*
 * status:
 *   idle      – nothing running, Setup is available
 *   starting  – "Start Interview" was clicked, interview is being prepared
 *   active    – interview running (everything except /interview is locked)
 *   finished  – interview just completed, user is sent to the results page
 */
export function InterviewProvider({ children }) {
    const [resume, setResume] = useState(readResume);
    const [status, setStatus] = useState("idle");
    const [active, setActive] = useState(null);
    const [lastResultId, setLastResultId] = useState(readLastResult);

    const isLocked = status === "starting" || status === "active";

    const saveResume = useCallback((nextResume) => {
        setResume(nextResume);
        try {
            sessionStorage.setItem(RESUME_KEY, JSON.stringify(nextResume));
        } catch { /* storage unavailable – keep in memory only */ }
    }, []);

    const clearResume = useCallback(() => {
        setResume(null);
        try {
            sessionStorage.removeItem(RESUME_KEY);
        } catch { /* ignore */ }
    }, []);

    const beginStarting = useCallback(() => setStatus("starting"), []);

    const failStarting = useCallback(() => setStatus("idle"), []);

    const activate = useCallback((payload) => {
        setActive(payload);
        setStatus("active");
    }, []);

    const markFinished = useCallback((interviewId) => {
        setActive(null);
        setLastResultId(String(interviewId));
        setStatus("finished");
        try {
            localStorage.setItem(LAST_RESULT_KEY, String(interviewId));
        } catch { /* ignore */ }
    }, []);

    // Warn before refresh / tab close while an interview is running.
    useEffect(() => {
        if (!isLocked) return undefined;

        const warn = (event) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [isLocked]);

    const value = useMemo(
        () => ({
            resume, saveResume, clearResume,
            status, isLocked, active,
            beginStarting, failStarting, activate, markFinished,
            lastResultId
        }),
        [
            resume, saveResume, clearResume, status, isLocked, active,
            beginStarting, failStarting, activate, markFinished, lastResultId
        ]
    );

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
}

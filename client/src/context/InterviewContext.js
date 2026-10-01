import { createContext, useContext } from "react";

export const InterviewContext = createContext(null);

export function useInterview() {
    const value = useContext(InterviewContext);

    if (!value) {
        throw new Error("useInterview must be used inside <InterviewProvider>.");
    }

    return value;
}

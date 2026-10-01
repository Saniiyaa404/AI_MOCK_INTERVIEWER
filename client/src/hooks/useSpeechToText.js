import { useCallback, useEffect, useRef, useState } from "react";

const SpeechRecognitionAPI =
    typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

// Errors where restarting would just fail again.
const FATAL_ERRORS = new Set([
    "not-allowed",
    "service-not-allowed",
    "audio-capture",
    "language-not-supported"
]);

const ERROR_MESSAGES = {
    "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings and try again.",
    "service-not-allowed": "Speech recognition is not allowed in this browser.",
    "audio-capture": "No microphone was found. Check that one is connected.",
    "network": "Speech recognition needs an internet connection.",
    "language-not-supported": "This language is not supported for voice input."
};

/*
 * Browser speech-to-text.
 *  - onFinalText(text) is called for every finished phrase.
 *  - `interim` holds the phrase currently being spoken (preview only).
 */
export function useSpeechToText({ onFinalText, lang = "en-IN" } = {}) {
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState("");
    const [error, setError] = useState("");

    const recognitionRef = useRef(null);
    const wantListeningRef = useRef(false);
    const onFinalTextRef = useRef(onFinalText);

    useEffect(() => {
        onFinalTextRef.current = onFinalText;
    }, [onFinalText]);

    const stop = useCallback(() => {
        wantListeningRef.current = false;
        recognitionRef.current?.stop();
    }, []);

    const start = useCallback(() => {
        if (!SpeechRecognitionAPI || wantListeningRef.current) return;

        setError("");
        setInterim("");

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setListening(true);

        recognition.onresult = (event) => {
            let interimText = "";

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    if (text.trim()) onFinalTextRef.current?.(text.trim());
                } else {
                    interimText += text;
                }
            }

            setInterim(interimText);
        };

        recognition.onerror = (event) => {
            if (event.error === "no-speech" || event.error === "aborted") return;

            if (FATAL_ERRORS.has(event.error)) wantListeningRef.current = false;

            setError(
                ERROR_MESSAGES[event.error] ||
                "Voice input stopped unexpectedly. You can keep typing instead."
            );
        };

        recognition.onend = () => {
            setInterim("");

            // Chrome ends the session after a pause in speech.
            // Restart it for as long as the user has not pressed Stop.
            if (wantListeningRef.current) {
                try {
                    recognition.start();
                    return;
                } catch {
                    wantListeningRef.current = false;
                }
            }

            setListening(false);
        };

        recognitionRef.current = recognition;
        wantListeningRef.current = true;

        try {
            recognition.start();
        } catch {
            wantListeningRef.current = false;
            setError("Could not start voice input. Please try again.");
        }
    }, [lang]);

    // Release the microphone when the component unmounts.
    useEffect(
        () => () => {
            wantListeningRef.current = false;
            recognitionRef.current?.abort();
        },
        []
    );

    return {
        supported: Boolean(SpeechRecognitionAPI),
        listening,
        interim,
        error,
        start,
        stop
    };
}

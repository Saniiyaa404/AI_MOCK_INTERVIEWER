import { useEffect, useRef, useState } from "react";
import { useInterview } from "../context/InterviewContext";
import { useSpeechToText } from "../hooks/useSpeechToText";
import {
  evaluateAnswer,
  generateAdaptiveQuestion,
  saveQuestionToDatabase,
  saveAnswerToDatabase,
  completeInterviewInDatabase
} from "../services/api";

const TOTAL_QUESTIONS = 10;
const PRIORITY_ORDER = { high: 1, medium: 2, low: 3 };

const timed = async (label, fn) => {
  const start = performance.now();
  const result = await fn();
  console.log(`⏱️ ${label} took ${(performance.now() - start).toFixed(0)} ms`);
  return result;
};

/* ---------------- Adaptive interview logic (unchanged) ---------------- */

const selectNextTopic = (
  latestScore,
  currentTopic,
  topicPlan,
  topicQuestionCount,
  followUpUsed
) => {
  if (!topicPlan || !topicPlan.topics) return null;

  const currentTopicCount = topicQuestionCount[currentTopic] || 0;

  // 1. WEAK ANSWER -> allow ONE follow-up
  if (latestScore < 7 && !followUpUsed && currentTopicCount < 2) {
    return { topic: currentTopic, isFollowUp: true };
  }

  // 2. Topics that have NEVER been asked, HIGH -> MEDIUM -> LOW
  const newTopics = topicPlan.topics.filter(
    (topic) => (topicQuestionCount[topic.name] || 0) === 0
  );

  if (newTopics.length > 0) {
    newTopics.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    return { topic: newTopics[0].name, isFollowUp: false };
  }

  // 3. Reuse topics that have been asked exactly once
  const reusableTopics = topicPlan.topics.filter(
    (topic) => (topicQuestionCount[topic.name] || 0) === 1
  );

  if (reusableTopics.length > 0) {
    reusableTopics.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    return { topic: reusableTopics[0].name, isFollowUp: false };
  }

  // 4. Every topic has already been asked twice
  return null;
};

const selectNextDifficulty = (
  latestScore,
  currentDifficulty,
  baselineDifficulty,
  currentQuestionWasFollowUp
) => {
  if (currentQuestionWasFollowUp) return baselineDifficulty;
  if (currentDifficulty !== baselineDifficulty) return baselineDifficulty;

  if (latestScore < 4) {
    if (baselineDifficulty === "Hard") return "Medium";
    return "Easy";
  }

  if (latestScore <= 8.5) return baselineDifficulty;

  if (baselineDifficulty === "Easy") return "Medium";
  return "Hard";
};

/* ---------------- Page ---------------- */

function InterviewPage() {
  const { active, markFinished } = useInterview();

  const role = active.role;
  const difficulty = active.difficulty; // baseline difficulty
  const interviewId = active.interviewId;
  const topicPlan = active.topicPlan;

  const [question, setQuestion] = useState(active.question);
  const [questionId, setQuestionId] = useState(active.questionId);
  const [currentTopic, setCurrentTopic] = useState(active.topic);
  const [currentDifficulty, setCurrentDifficulty] = useState(active.difficulty);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [coveredTopics, setCoveredTopics] = useState([]);
  const [topicQuestionCount, setTopicQuestionCount] = useState({
    [active.topic]: 1
  });
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [busy, setBusy] = useState(null); // evaluating | generating | finishing
  const [notice, setNotice] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const isGeneratingNextQuestionRef = useRef(false);

  const notify = (text, tone = "info") => setNotice({ text, tone });
  const isLast = questionNumber >= TOTAL_QUESTIONS;

  /* ----- voice input: spoken phrases are appended to the answer ----- */
  const speech = useSpeechToText({
    onFinalText: (text) =>
      setAnswer((previous) => (previous.trim() ? `${previous.trimEnd()} ${text}` : text))
  });

  const answerLocked = busy !== null || Boolean(evaluation);
  const stopSpeech = speech.stop;

  // Stop the microphone as soon as the answer is submitted or the page is busy.
  useEffect(() => {
    if (answerLocked) stopSpeech();
  }, [answerLocked, stopSpeech]);

  /* ----- submit answer ----- */
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      notify("Please enter your answer.", "error");
      return;
    }

    try {
      setBusy("evaluating");
      setNotice(null);

      const data = await timed("Evaluation API", () =>
        evaluateAnswer(question, answer, role, currentDifficulty)
      );

      setEvaluation(data.evaluation);

      await timed("Answer DB save", () =>
        saveAnswerToDatabase(
          interviewId,
          questionId,
          answer,
          data.evaluation.technicalAccuracy,
          data.evaluation.completeness,
          data.evaluation.communicationClarity,
          data.evaluation.overallScore,
          data.evaluation.feedback,
          data.evaluation.improvement
        )
      );

      setInterviewHistory((previous) => [
        ...previous,
        {
          question,
          topic: currentTopic,
          difficulty: currentDifficulty,
          isFollowUp: followUpUsed,
          answer,
          evaluation: data.evaluation
        }
      ]);

      if (data.evaluation.overallScore >= 7) {
        setCoveredTopics((previous) =>
          previous.includes(currentTopic) ? previous : [...previous, currentTopic]
        );
      }

      notify("Answer evaluated.", "ok");
    } catch (error) {
      console.error(error);
      notify("Failed to evaluate answer. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  };

  /* ----- complete interview (last question or "End interview") ----- */
  const completeInterview = async () => {
    await completeInterviewInDatabase(interviewId);
    // The route guard sends the user to /results/:id.
    markFinished(interviewId);
  };

  /* ----- next question ----- */
  const handleNextQuestion = async () => {
    if (isGeneratingNextQuestionRef.current) return;

    if (!evaluation) {
      notify("Submit your answer first.", "error");
      return;
    }

    isGeneratingNextQuestionRef.current = true;

    try {
      if (isLast) {
        setBusy("finishing");
        notify("Completing interview…");
        await completeInterview();
        return;
      }

      setBusy("generating");
      notify("Selecting next topic…");

      const latestScore = evaluation?.overallScore ?? 0;
      const latestItem = interviewHistory[interviewHistory.length - 1];
      const currentQuestionWasFollowUp = followUpUsed;

      const nextTopic = selectNextTopic(
        latestScore,
        currentTopic,
        topicPlan,
        topicQuestionCount,
        followUpUsed
      );

      if (!nextTopic) {
        notify("No more topics available. You can end the interview now.", "error");
        return;
      }

      const nextDifficulty = selectNextDifficulty(
        latestScore,
        currentDifficulty,
        difficulty,
        currentQuestionWasFollowUp
      );

      console.log("NEXT QUESTION:", {
        currentTopic,
        latestScore,
        followUpUsed,
        topicQuestionCount,
        nextTopic,
        nextDifficulty
      });

      setFollowUpUsed(nextTopic.isFollowUp);

      notify(
        nextTopic.isFollowUp
          ? "Generating follow-up question…"
          : "Generating question on a new topic…"
      );

      // The previous answer/evaluation is only sent for follow-ups.
      const latestItemForAI = nextTopic.isFollowUp ? latestItem : null;

      const data = await timed("Question generation API", () =>
        generateAdaptiveQuestion(role, nextDifficulty, nextTopic.topic, latestItemForAI)
      );

      const nextQuestionNumber = questionNumber + 1;

      const savedQuestion = await timed("Question DB save", () =>
        saveQuestionToDatabase(
          interviewId,
          nextQuestionNumber,
          nextTopic.topic,
          nextDifficulty,
          nextTopic.isFollowUp,
          data.question
        )
      );

      setQuestionId(savedQuestion.question.id);
      setQuestion(data.question);

      // Use the topic chosen by the application, not the AI's returned topic.
      setCurrentTopic(nextTopic.topic);
      setCurrentDifficulty(nextDifficulty);

      setTopicQuestionCount((previous) => ({
        ...previous,
        [nextTopic.topic]: (previous[nextTopic.topic] || 0) + 1
      }));

      setQuestionNumber(nextQuestionNumber);
      setAnswer("");
      setEvaluation(null);
      notify("Next question ready.", "ok");
    } catch (error) {
      console.error(error);
      notify(
        isLast ? "Failed to complete interview." : "Failed to generate next question.",
        "error"
      );
    } finally {
      isGeneratingNextQuestionRef.current = false;
      setBusy(null);
    }
  };

  /* ----- end early ----- */
  const handleEndInterview = async () => {
    if (isGeneratingNextQuestionRef.current) return;
    isGeneratingNextQuestionRef.current = true;

    try {
      setConfirmEnd(false);
      setBusy("finishing");
      notify("Completing interview…");
      await completeInterview();
    } catch (error) {
      console.error(error);
      notify("Failed to complete interview.", "error");
      isGeneratingNextQuestionRef.current = false;
      setBusy(null);
    }
  };

  const hasAnswered = interviewHistory.length > 0;
  const progress = ((questionNumber - (evaluation ? 0 : 1)) / TOTAL_QUESTIONS) * 100;
  const scoreAngle = Math.min(Number(evaluation?.overallScore) || 0, 10) * 36;

  const topicState = (name) => {
    if (name === currentTopic) return "now";
    if (coveredTopics.includes(name)) return "done";
    return "";
  };

  return (
    <main className="page">
      <div className="page-head">
        <div className="pill-row">
          <span className="pill">{role}</span>
          <span className="pill">{difficulty} difficulty</span>
          <span className="pill pill-ok">In progress</span>
        </div>
        <h1 style={{ marginTop: 14 }}>
          Question {questionNumber} of {TOTAL_QUESTIONS}
        </h1>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOTAL_QUESTIONS}
          aria-valuenow={questionNumber - (evaluation ? 0 : 1)}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="interview-grid">
        <div className="stack">
          {/* ---------- Question ---------- */}
          <section className="card">
            <div className="pill-row">
              <span className="pill">{currentTopic}</span>
              <span className={`pill pill-${currentDifficulty.toLowerCase() === "hard" ? "high" : currentDifficulty.toLowerCase() === "medium" ? "medium" : "low"}`}>
                {currentDifficulty}
              </span>
              <span className={`pill ${followUpUsed ? "pill-medium" : ""}`}>
                {followUpUsed ? "Follow-up" : "Normal"}
              </span>
            </div>

            <p className="q-text">{question}</p>

            <div className="field">
              <div className="field-head">
                <label htmlFor="answer-box">Your answer</label>

                {speech.supported && (
                  <button
                    type="button"
                    className={`mic-btn${speech.listening ? " is-listening" : ""}`}
                    onClick={speech.listening ? speech.stop : speech.start}
                    disabled={answerLocked}
                    aria-pressed={speech.listening}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
                    </svg>
                    {speech.listening ? "Stop recording" : "Speak your answer"}
                  </button>
                )}
              </div>

              <textarea
                id="answer-box"
                className="textarea"
                rows={7}
                value={answer}
                disabled={answerLocked}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer here, or use the microphone to speak it. Explain your reasoning, not just the definition."
              />

              {speech.listening && (
                <p className="listening" role="status">
                  <i aria-hidden="true" />
                  <span>{speech.interim || "Listening… start speaking"}</span>
                </p>
              )}
              {speech.error && <p className="notice notice-error" role="alert">{speech.error}</p>}
            </div>
            <div className="hint hint-row">
              <span>
                {speech.supported
                  ? "Tip: you can edit the text after speaking."
                  : "Tip: mention an example or an edge case. Voice input needs Chrome or Edge."}
              </span>
              <span>{answer.length} characters</span>
            </div>

            <div className="actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitAnswer}
                disabled={answerLocked || !answer.trim()}
              >
                {busy === "evaluating" ? <><span className="spinner" /> Evaluating…</> : "Submit answer"}
              </button>

              {evaluation && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleNextQuestion}
                  disabled={busy !== null}
                >
                  {busy === "generating" || busy === "finishing"
                    ? <><span className="spinner" /> Please wait…</>
                    : isLast ? "Finish interview" : "Next question"}
                </button>
              )}

              <span className="spacer" />

              {!isLast && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setConfirmEnd(true)}
                  disabled={busy !== null || !hasAnswered}
                  title={hasAnswered ? "" : "Answer at least one question first"}
                >
                  End interview
                </button>
              )}
            </div>

            {notice && (
              <p
                className={`notice ${notice.tone === "error" ? "notice-error" : notice.tone === "ok" ? "notice-ok" : ""}`}
                role={notice.tone === "error" ? "alert" : "status"}
              >
                {notice.text}
              </p>
            )}
          </section>

          {/* ---------- Evaluation ---------- */}
          {evaluation && (
            <section className="card card-hero eval">
              <p className="eyebrow">AI evaluation</p>
              <div className="eval-top">
                <div className="ring" style={{ "--angle": `${scoreAngle}deg` }}>
                  <div className="ring-inner">
                    <strong>{evaluation.overallScore}</strong>
                    <span>/ 10</span>
                  </div>
                </div>

                <div className="metrics">
                  <Metric label="Technical accuracy" value={evaluation.technicalAccuracy} color="var(--blue)" />
                  <Metric label="Completeness" value={evaluation.completeness} color="var(--amber)" />
                  <Metric label="Communication clarity" value={evaluation.communicationClarity} color="var(--purple)" />
                </div>
              </div>

              <div className="fb">
                <div className="fb-good">
                  <h3>Feedback</h3>
                  <p>{evaluation.feedback}</p>
                </div>
                <div className="fb-improve">
                  <h3>Area for improvement</h3>
                  <p>{evaluation.improvement}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ---------- Sidebar ---------- */}
        <aside className="side">
          <section className="card">
            <h2>Topic plan</h2>
            <ul className="plan">
              {topicPlan.topics.map((topic) => (
                <li key={topic.name} className={topicState(topic.name)} title={topic.reason}>
                  <span>{topic.name}</span>
                  <em className={`pill pill-${String(topic.priority).toLowerCase()}`}>
                    {topic.priority}
                  </em>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>History</h2>
            {interviewHistory.length === 0 ? (
              <p className="lead card-lead">Your answers appear here as you go.</p>
            ) : (
              interviewHistory.map((item, index) => (
                <details key={index} className="history-item">
                  <summary>
                    <span>Question {index + 1}</span>
                    <span className={`pill ${item.evaluation.overallScore >= 7 ? "pill-ok" : "pill-medium"}`}>
                      {item.evaluation.overallScore}/10
                    </span>
                  </summary>
                  <p><strong>Question:</strong> {item.question}</p>
                  <p><strong>Your answer:</strong> {item.answer}</p>
                  <p className="muted">{item.topic} · {item.isFollowUp ? "Follow-up" : "Normal"}</p>
                </details>
              ))
            )}
          </section>
        </aside>
      </div>

      {confirmEnd && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title">
          <div className="card overlay-card">
            <h2 id="end-title">End the interview now?</h2>
            <p className="lead">
              You have answered {interviewHistory.length} of {TOTAL_QUESTIONS} questions.
              Your results will be based on those answers.
            </p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <button type="button" className="btn" onClick={() => setConfirmEnd(false)}>
                Keep going
              </button>
              <button type="button" className="btn btn-danger" onClick={handleEndInterview}>
                End and view results
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="metric">
      <div className="metric-row">
        <span>{label}</span>
        <strong>{value}/10</strong>
      </div>
      <div className="bar">
        <i style={{ width: `${Math.min(Number(value) || 0, 10) * 10}%`, background: color }} />
      </div>
    </div>
  );
}

export default InterviewPage;
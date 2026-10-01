import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "../components/ResumeUploader";
import { useInterview } from "../context/InterviewContext";
import {
  startInterviewInDatabase,
  generateTopicPlan,
  generateQuestion,
  saveQuestionToDatabase
} from "../services/api";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const STEPS = [
  "Creating your interview",
  "Planning topics from your resume",
  "Preparing your first question"
];

function SetupPage() {
  const navigate = useNavigate();
  const { resume, saveResume, clearResume, status, beginStarting, failStarting, activate } =
    useInterview();

  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const starting = status === "starting";
  const canStart = Boolean(resume) && role.trim().length > 0 && !starting;

  const handleStartInterview = async () => {
    if (!canStart) return;

    setError("");
    setStep(0);
    // From this moment the interview is "running": Setup is locked in the navbar.
    beginStarting();

    try {
      const trimmedRole = role.trim();

      const dbData = await startInterviewInDatabase(
        trimmedRole,
        difficulty,
        resume.resumeId
      );
      const interviewId = dbData.interview.id;

      setStep(1);
      const topicPlan = await generateTopicPlan(
        resume.resumeText,
        trimmedRole,
        difficulty
      );

      setStep(2);
      const data = await generateQuestion(
        resume.resumeText,
        trimmedRole,
        difficulty,
        topicPlan
      );

      const savedQuestion = await saveQuestionToDatabase(
        interviewId,
        1,
        data.topic,
        difficulty,
        false,
        data.question
      );

      activate({
        interviewId,
        role: trimmedRole,
        difficulty,
        topicPlan,
        question: data.question,
        topic: data.topic,
        questionId: savedQuestion.question.id,
        resumeText: resume.resumeText
      });

      // replace: Setup is removed from the history stack, so the
      // browser Back button cannot return to it during the interview.
      navigate("/interview", { replace: true });
    } catch (err) {
      console.error("START INTERVIEW ERROR:", err);
      failStarting();
      setError(err.message || "Failed to start interview. Please try again.");
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Step 1 of 2</p>
        <h1>Set up your mock interview</h1>
        <p className="lead">
          Upload your resume, choose a role and difficulty, and get ten
          adaptive questions built from your own projects.
        </p>
      </div>

      <div className="setup-grid">
        <section className="card">
          <h2>Your resume</h2>
          <p className="lead card-lead">One PDF. It stays on your machine and database.</p>

          <ResumeUploader
            resume={resume}
            disabled={starting}
            onResumeExtracted={(text, id, fileName) =>
              saveResume({ resumeText: text, resumeId: id, fileName })
            }
            onRemove={clearResume}
          />
        </section>

        <section className="card">
          <h2>Interview setup</h2>
          <p className="lead card-lead">Pick what you are interviewing for.</p>

          <label className="field">
            <span>Job role</span>
            <input
              className="input"
              type="text"
              placeholder="e.g. Backend Developer"
              value={role}
              disabled={starting}
              onChange={(event) => setRole(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleStartInterview()}
            />
          </label>

          <div className="field">
            <span>Difficulty</span>
            <div className="seg" role="radiogroup" aria-label="Difficulty">
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === level}
                  className={difficulty === level ? "on" : ""}
                  disabled={starting}
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ marginTop: 24 }}
            disabled={!canStart}
            onClick={handleStartInterview}
          >
            {starting ? <><span className="spinner" /> Preparing…</> : "Start interview"}
          </button>

          {!starting && !canStart && (
            <p className="hint">
              {resume ? "Enter a job role to continue." : "Upload your resume to continue."}
            </p>
          )}

          {error && <p className="notice notice-error" role="alert">{error}</p>}
        </section>
      </div>

      {starting && (
        <div className="overlay" role="status" aria-live="polite">
          <div className="card overlay-card">
            <span className="spinner spinner-lg" />
            <h2>Getting your interview ready</h2>
            <ol className="progress-steps">
              {STEPS.map((label, index) => (
                <li
                  key={label}
                  className={index < step ? "done" : index === step ? "now" : ""}
                >
                  {label}
                </li>
              ))}
            </ol>
            <p className="lead">This usually takes a few seconds.</p>
          </div>
        </div>
      )}

      <section className="how">
        <h2>How it works</h2>
        <ol>
          <li><strong>Plan.</strong> The AI picks topics from your resume and the role.</li>
          <li><strong>Answer.</strong> Each answer is scored on accuracy, completeness and clarity.</li>
          <li><strong>Adapt.</strong> Weak answers get a follow-up; strong ones raise the difficulty.</li>
        </ol>
      </section>
    </main>
  );
}

export default SetupPage;

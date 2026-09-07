import { useState } from "react";
import { 
  startInterview, 
  generateQuestion,
  evaluateAnswer
 } from "../services/api";

function InterviewSetup({ resumeText }) {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const handleStartInterview = async () => {
    if (!role) {
        setMessage("Please enter a job role.");
        return;
    }

    if (!resumeText) {
        setMessage("Please upload your resume first.");
        return;
    }

    try {
        await startInterview(role, difficulty);

        const data = await generateQuestion(
            resumeText,
            role,
            difficulty
        );

        setQuestion(data.question);

        setMessage("Interview started!");
    } catch (error) {
        console.error(error);
        setMessage("Failed to start interview.");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
        setMessage("Please enter your answer.");
        return;
    }

    try {
        setMessage("Evaluating answer...");

        const data = await evaluateAnswer(
            question,
            answer,
            role,
            difficulty
        );

        setEvaluation(data.evaluation);
        setMessage("Answer evaluated!");
    } catch (error) {
        console.error(error);
        setMessage("Failed to evaluate answer.");
    }
  };

  return (
    <div>
      <h2>Interview Setup</h2>

      <div>
        <label>Job Role</label>

        <input
          type="text"
          placeholder="e.g. Backend Developer"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
      </div>

      <div>
        <label>Difficulty</label>

        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <button onClick={handleStartInterview}>
        Start Interview
      </button>

      <p>{message}</p>
      {question && (
        <div>
          <h3>Interview Question</h3>

          <p>{question}</p>

          <h3>Your Answer</h3>
          <textarea
              rows="6"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your answer here..."
          />

          <br />

          <button onClick={handleSubmitAnswer}>
              Submit Answer
          </button>

        </div>
      )}

      {evaluation && (
          <div>
              <h3>AI Evaluation</h3>

              <div>
                  <p>
                      Technical Accuracy:
                      {" "}
                      {evaluation.technicalAccuracy}/10
                  </p>

                  <p>
                      Completeness:
                      {" "}
                      {evaluation.completeness}/10
                  </p>

                  <p>
                      Communication Clarity:
                      {" "}
                      {evaluation.communicationClarity}/10
                  </p>

                  <p>
                      Overall Score:
                      {" "}
                      {evaluation.overallScore}/10
                  </p>

                  <h4>Feedback</h4>
                  <p>{evaluation.feedback}</p>

                  <h4>Area for Improvement</h4>
                  <p>{evaluation.improvement}</p>
              </div>
          </div>
      )}

    </div>
  );
}

export default InterviewSetup;
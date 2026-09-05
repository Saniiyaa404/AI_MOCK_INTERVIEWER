import { useState } from "react";
import { startInterview } from "../services/api";

function InterviewSetup() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [message, setMessage] = useState("");

  const handleStartInterview = async () => {
    if (!role) {
      setMessage("Please enter a job role.");
      return;
    }

    try {
      const data = await startInterview(role, difficulty);

      setMessage(
        `${data.message} Role: ${data.role}, Difficulty: ${data.difficulty}`
      );
    } catch (error) {
      console.error(error);
      setMessage("Failed to start interview.");
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
    </div>
  );
}

export default InterviewSetup;
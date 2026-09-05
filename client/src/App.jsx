import ResumeUploader from "./components/ResumeUploader";
import InterviewSetup from "./components/InterviewSetup";

function App() {
  return (
    <div>
      <h1>AI Mock Interviewer</h1>

      <ResumeUploader />

      <hr />

      <InterviewSetup />
    </div>
  );
}

export default App;
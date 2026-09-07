import { useState } from "react";
import ResumeUploader from "./components/ResumeUploader";
import InterviewSetup from "./components/InterviewSetup";

function App() {
    const [resumeText, setResumeText] = useState("");

    return (
        <div>
            <h1>AI Mock Interviewer</h1>

            <ResumeUploader
                onResumeExtracted={setResumeText}
            />

            <hr />

            <InterviewSetup
                resumeText={resumeText}
            />
        </div>
    );
}

export default App;
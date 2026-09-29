import { useState } from "react";
import ResumeUploader from "./components/ResumeUploader";
import InterviewSetup from "./components/InterviewSetup";

function App() {
    const [resumeText, setResumeText] = useState("");
    const [resumeId, setResumeId] = useState(null);

    return (
        <div>
            <h1>AI Mock Interviewer</h1>

            <ResumeUploader
                onResumeExtracted={(text, id) => {
                    setResumeText(text);
                    setResumeId(id);
                }}
            />

            <hr />

            <InterviewSetup
                resumeText={resumeText}
                resumeId={resumeId}
            />
            
        </div>
    );
}

export default App;
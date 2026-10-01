import { useState } from "react";
import ResumeUploader from "./components/ResumeUploader";
import InterviewSetup from "./components/InterviewSetup";

//testing
import ResultsDashboard from "./components/ResultsDashboard";

function App() {
    const [resumeText, setResumeText] = useState("");
    const [resumeId, setResumeId] = useState(null);

    //testing
    const TEST_INTERVIEW_ID = "2ec0e57d-90d4-487f-af14-20b4b89c46fa";

    // return (
    //     <div>
    //         <h1>AI Mock Interviewer</h1>

    //         <ResumeUploader
    //             onResumeExtracted={(text, id) => {
    //                 setResumeText(text);
    //                 setResumeId(id);
    //             }}
    //         />

    //         <hr />

    //         <InterviewSetup
    //             resumeText={resumeText}
    //             resumeId={resumeId}
    //         />
            
    //     </div>
    // );

    return (
        <ResultsDashboard
            interviewId={TEST_INTERVIEW_ID}
        />
    );
}

export default App;
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useInterview } from "./context/InterviewContext";
import SetupPage from "./pages/SetupPage";
import InterviewPage from "./pages/InterviewPage";
import HistoryPage from "./pages/HistoryPage";
import ResultsPage from "./pages/ResultsPage";
import "./pages/pages.css";

/*
 * Route guards
 * - While an interview is running, only /interview is reachable.
 * - /interview itself is only reachable while an interview is running.
 */
function lockedTarget(status) {
    return status === "active" ? "/interview" : "/setup";
}

function Unlocked({ children }) {
    const { status, isLocked } = useInterview();

    return isLocked ? <Navigate to={lockedTarget(status)} replace /> : children;
}

function InterviewRoute() {
    const { status, lastResultId } = useInterview();

    if (status === "active") return <InterviewPage />;

    if (status === "finished" && lastResultId) {
        return <Navigate to={`/results/${lastResultId}`} replace />;
    }

    return <Navigate to="/setup" replace />;
}

function SetupRoute() {
    const { status } = useInterview();

    // "starting" stays on Setup (loading overlay); "active" goes to the interview.
    return status === "active" ? <Navigate to="/interview" replace /> : <SetupPage />;
}

function App() {
    return (
        <>
            <NavBar />

            <Routes>
                <Route path="/" element={<Navigate to="/setup" replace />} />
                <Route path="/setup" element={<SetupRoute />} />
                <Route path="/interview" element={<InterviewRoute />} />
                <Route path="/history" element={<Unlocked><HistoryPage /></Unlocked>} />
                <Route path="/results" element={<Unlocked><ResultsPage /></Unlocked>} />
                <Route path="/results/:interviewId" element={<Unlocked><ResultsPage /></Unlocked>} />
                <Route path="*" element={<Navigate to="/setup" replace />} />
            </Routes>
        </>
    );
}

export default App;

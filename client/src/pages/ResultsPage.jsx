import { Link, Navigate, useParams } from "react-router-dom";
import ResultsDashboard from "../components/ResultsDashboard";
import { useInterview } from "../context/InterviewContext";

function ResultsPage() {
  const { interviewId } = useParams();
  const { lastResultId } = useInterview();

  // /results -> latest finished interview, if there is one
  if (!interviewId && lastResultId) {
    return <Navigate to={`/results/${lastResultId}`} replace />;
  }

  if (!interviewId) {
    return (
      <main className="page">
        <div className="empty">
          <h2>No results yet</h2>
          <p className="lead">Finish an interview and your results dashboard will appear here.</p>
          <Link to="/setup" className="btn btn-primary">Start an interview</Link>
        </div>
      </main>
    );
  }

  return <ResultsDashboard key={interviewId} interviewId={interviewId} />;
}

export default ResultsPage;

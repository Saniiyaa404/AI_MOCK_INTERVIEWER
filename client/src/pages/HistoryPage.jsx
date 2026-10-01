import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInterviewHistory } from "../services/api";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "—";

const scoreClass = (score) =>
  score >= 8 ? "score-good" : score >= 6 ? "score-mid" : "score-low";

function HistoryPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getInterviewHistory()
      .then((data) => {
        if (!cancelled) setInterviews(data.interviews || []);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Could not load your interview history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scored = interviews.filter(
    (item) => item.answered_questions > 0 && item.overall_score !== null
  );
  const average = scored.length
    ? scored.reduce((sum, item) => sum + Number(item.overall_score), 0) / scored.length
    : null;
  const best = scored.length
    ? Math.max(...scored.map((item) => Number(item.overall_score)))
    : null;

  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Your progress</p>
        <h1>Interview history</h1>
        <p className="lead">Every interview you have taken, newest first.</p>
      </div>

      {loading && <p className="notice" role="status">Loading your interviews…</p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}

      {!loading && !error && interviews.length === 0 && (
        <div className="empty">
          <h2>No interviews yet</h2>
          <p className="lead">Your completed interviews will show up here.</p>
          <Link to="/setup" className="btn btn-primary">Start your first interview</Link>
        </div>
      )}

      {!loading && interviews.length > 0 && (
        <>
          <div className="stats">
            <div className="card stat">
              <span>Interviews</span>
              <strong>{interviews.length}</strong>
            </div>
            <div className="card stat">
              <span>Average score</span>
              <strong>{average === null ? "—" : average.toFixed(1)}<small> / 10</small></strong>
            </div>
            <div className="card stat">
              <span>Best score</span>
              <strong>{best === null ? "—" : best.toFixed(1)}<small> / 10</small></strong>
            </div>
          </div>

          <ul className="history-list">
            {interviews.map((item) => {
              const score = item.overall_score === null ? null : Number(item.overall_score);
              const completed = item.status === "completed";

              return (
                <li key={item.id}>
                  <Link to={`/results/${item.id}`} className="card history-row">
                    <div className="history-main">
                      <h3>{item.role}</h3>
                      <div className="pill-row">
                        <span className="pill">{item.baseline_difficulty}</span>
                        <span className={`pill ${completed ? "pill-ok" : "pill-medium"}`}>
                          {completed ? "Completed" : "Not completed"}
                        </span>
                        <span className="pill pill-muted">{formatDate(item.started_at)}</span>
                      </div>
                    </div>

                    <div className="history-meta">
                      <span>{item.answered_questions} / {item.total_questions} answered</span>
                    </div>

                    <div className={`history-score ${score === null ? "" : scoreClass(score)}`}>
                      <strong>{score === null ? "—" : score.toFixed(1)}</strong>
                      <span>/ 10</span>
                    </div>

                    <span className="history-go" aria-hidden="true">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}

export default HistoryPage;

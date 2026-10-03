const API_URL = import.meta.env.VITE_API_URL;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../services/api";
import "./ResultsDashboard.css";

function ResultsDashboard({ interviewId }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openQuestion, setOpenQuestion] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const authHeaders = await getAuthHeaders();

                const response = await fetch(
                    `${API_URL}/api/interview/${interviewId}/results`,
                    {
                        headers: authHeaders,
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch results");
                }

                const data = await response.json();

                setResults(data);
            } catch (error) {
                console.error(error);
                setError("Failed to load interview results.");
            } finally {
                setLoading(false);
            }
        };

        if (interviewId) {
            fetchResults();
        }
    }, [interviewId]);

    if (loading) {
        return (
            <div className="results-page">
                <div className="results-loading">
                    <p>Loading interview results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="results-page">
                <div className="results-error">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="results-page">
                <div className="results-error">
                    <p>No results available.</p>
                </div>
            </div>
        );
    }

    const { interview, summary, questions } = results;

    const getPerformanceLabel = (score) => {
        if (score >= 9) return "Excellent Performance";
        if (score >= 8) return "Strong Performance";
        if (score >= 6) return "Good Progress";
        return "Keep Practicing";
    };

    const getScoreClass = (score) => {
        if (score >= 8) return "score-strong";
        if (score >= 6) return "score-medium";
        return "score-low";
    };

    /*
     * Build meaningful improvement areas from the
     * lowest-scoring evaluation dimensions and questions.
     */

    const metricScores = [
        {
            name: "Technical Accuracy",
            score: Number(summary.technicalAccuracy)
        },
        {
            name: "Completeness",
            score: Number(summary.completeness)
        },
        {
            name: "Communication Clarity",
            score: Number(summary.communicationClarity)
        }
    ];

    const weakestMetric = [...metricScores].sort(
        (a, b) => a.score - b.score
    )[0];

    const improvementQuestions = [...questions]
        .filter(
            (question) =>
                question.improvement &&
                question.overall_score !== null
        )
        .sort(
            (a, b) =>
                Number(a.overall_score) -
                Number(b.overall_score)
        )
        .slice(0, 3);

    const scoreAngle =
        Math.min(Number(summary.overallScore) || 0, 10) * 36;

    return (
        <div className="results-page">

            {/* =========================
                HERO SECTION
            ========================= */}

            <section className="results-hero">

                <div className="hero-content">

                    <p className="results-label">
                        INTERVIEW COMPLETE
                    </p>

                    <h1>Interview Results</h1>

                    <p className="results-subtitle">
                        A detailed overview of your technical interview
                        performance.
                    </p>

                    <div className="hero-tags">

                        <span className="hero-tag">
                            {interview.role}
                        </span>

                        <span className="hero-tag">
                            {interview.baseline_difficulty} Difficulty
                        </span>

                        <span className="hero-tag completed-tag">
                            {interview.status === "completed"
                                ? "✓ Completed"
                                : "Not completed"}
                        </span>

                    </div>

                </div>

                <div className="hero-score">

                    <div
                        className="score-ring"
                        style={{
                            "--score-angle": `${scoreAngle}deg`
                        }}
                    >
                        <div className="score-ring-inner">

                            <strong>
                                {summary.overallScore}
                            </strong>

                            <span>
                                / 10
                            </span>

                        </div>
                    </div>

                    <h2>
                        {getPerformanceLabel(
                            summary.overallScore
                        )}
                    </h2>

                    <p>
                        {summary.answeredQuestions} / 10 questions answered
                    </p>

                </div>

            </section>


            {/* =========================
                METRIC CARDS
            ========================= */}

            <section className="metrics-section">

                <div className="section-heading">

                    <div>
                        <p className="section-label">
                            PERFORMANCE
                        </p>

                        <h2>Key Metrics</h2>
                    </div>

                </div>

                <div className="metrics-grid">

                    <div className="metric-card">

                        <div className="metric-header">
                            <span>
                                Technical Accuracy
                            </span>

                            <strong>
                                {summary.technicalAccuracy}/10
                            </strong>
                        </div>

                        <div className="metric-bar">
                            <div
                                className={`metric-bar-fill ${getScoreClass(
                                    summary.technicalAccuracy
                                )}`}
                                style={{
                                    width: `${
                                        summary.technicalAccuracy * 10
                                    }%`
                                }}
                            />
                        </div>

                    </div>


                    <div className="metric-card">

                        <div className="metric-header">
                            <span>
                                Completeness
                            </span>

                            <strong>
                                {summary.completeness}/10
                            </strong>
                        </div>

                        <div className="metric-bar">
                            <div
                                className={`metric-bar-fill ${getScoreClass(
                                    summary.completeness
                                )}`}
                                style={{
                                    width: `${
                                        summary.completeness * 10
                                    }%`
                                }}
                            />
                        </div>

                    </div>


                    <div className="metric-card">

                        <div className="metric-header">
                            <span>
                                Communication Clarity
                            </span>

                            <strong>
                                {summary.communicationClarity}/10
                            </strong>
                        </div>

                        <div className="metric-bar">
                            <div
                                className={`metric-bar-fill ${getScoreClass(
                                    summary.communicationClarity
                                )}`}
                                style={{
                                    width: `${
                                        summary.communicationClarity * 10
                                    }%`
                                }}
                            />
                        </div>

                    </div>

                </div>

            </section>


            {/* =========================
                PERFORMANCE BREAKDOWN
            ========================= */}

            <section className="performance-breakdown">

                <div className="section-heading">

                    <div>
                        <p className="section-label">
                            QUESTION ANALYSIS
                        </p>

                        <h2>Performance Breakdown</h2>
                    </div>

                    <span className="question-count">
                        {questions.length} Questions
                    </span>

                </div>

                <div className="performance-chart">

                    <div className="chart-grid-line line-10">
                        <span>10</span>
                    </div>

                    <div className="chart-grid-line line-8">
                        <span>8</span>
                    </div>

                    <div className="chart-grid-line line-6">
                        <span>6</span>
                    </div>

                    <div className="chart-grid-line line-4">
                        <span>4</span>
                    </div>

                    <div className="chart-grid-line line-2">
                        <span>2</span>
                    </div>

                    <div className="chart-grid-line line-0">
                        <span>0</span>
                    </div>

                    {questions.map((question) => {

                        const score =
                            Number(question.overall_score) || 0;

                        return (
                            <div
                                className="chart-column"
                                key={question.id}
                            >

                                <span
                                    className="chart-score"
                                    style={{
                                        bottom: `${score * 24 + 6}px`
                                    }}
                                >
                                    {score.toFixed(1)}
                                </span>

                                <div className="chart-bar-container">

                                    <div
                                        className={`chart-bar ${
                                            score >= 9
                                                ? "chart-excellent"
                                                : score >= 8
                                                ? "chart-strong"
                                                : score >= 6
                                                ? "chart-medium"
                                                : "chart-low"
                                        }`}
                                        style={{
                                            height: `${score * 10}%`
                                        }}
                                    />

                                </div>

                                <span className="chart-question">
                                    Q{question.question_number}
                                </span>

                            </div>
                        );
                    })}

                </div>

            </section>


            {/* =========================
                DETAILED QUESTION REVIEW
            ========================= */}

            <section className="questions-section">

                <div className="section-heading">

                    <div>
                        <p className="section-label">
                            DETAILED REVIEW
                        </p>

                        <h2>Question-wise Review</h2>
                    </div>

                </div>

                <div className="question-list">

                    {questions.map((question) => {

                        const isOpen =
                            openQuestion === question.id;

                        return (
                            <div
                                className={`question-card ${
                                    isOpen
                                        ? "question-card-open"
                                        : ""
                                }`}
                                key={question.id}
                            >

                                <button
                                    className="question-card-header"
                                    onClick={() =>
                                        setOpenQuestion(
                                            isOpen
                                                ? null
                                                : question.id
                                        )
                                    }
                                >

                                    <div className="question-number">
                                        Q{question.question_number}
                                    </div>

                                    <div className="question-title">

                                        <h3>
                                            Question{" "}
                                            {question.question_number}
                                        </h3>

                                        <div className="question-tags">

                                            <span className="tag">
                                                {question.topic}
                                            </span>

                                            <span className="tag">
                                                {question.difficulty}
                                            </span>

                                            <span
                                                className={
                                                    question.is_follow_up
                                                        ? "tag follow-up-tag"
                                                        : "tag"
                                                }
                                            >
                                                {question.is_follow_up
                                                    ? "Follow-up"
                                                    : "Normal"}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="question-score">

                                        <strong>
                                            {question.overall_score ??
                                                "N/A"}
                                        </strong>

                                        <span>
                                            /10
                                        </span>

                                    </div>

                                    <div className="expand-icon">
                                        {isOpen ? "⌃" : "⌄"}
                                    </div>

                                </button>


                                {isOpen && (
                                    <div className="question-details">

                                        {question.question_text && (
                                            <p className="question-text">
                                                {question.question_text}
                                            </p>
                                        )}

                                        {question.answer_text && (
                                            <details className="answer-toggle">

                                                <summary>
                                                    Your Answer
                                                </summary>

                                                <div className="answer-box">
                                                    {question.answer_text}
                                                </div>

                                            </details>
                                        )}

                                        {question.feedback && (
                                            <div className="feedback-block">

                                                <h4>
                                                    Feedback
                                                </h4>

                                                <p>
                                                    {question.feedback}
                                                </p>

                                            </div>
                                        )}

                                        {question.improvement && (
                                            <div className="improvement-block">

                                                <h4>
                                                    How to Improve
                                                </h4>

                                                <p>
                                                    {question.improvement}
                                                </p>

                                            </div>
                                        )}

                                    </div>
                                )}

                            </div>
                        );
                    })}

                </div>

            </section>


            {/* =========================
                AREAS OF IMPROVEMENT
            ========================= */}

            <section className="improvement-summary">

                <div className="section-heading">

                    <div>
                        <p className="section-label">
                            FOCUS AREAS
                        </p>

                        <h2>Areas of Improvement</h2>
                    </div>

                </div>

                <div className="improvement-grid">

                    <div className="improvement-card primary-improvement">

                        <div className="improvement-icon">
                            ↗
                        </div>

                        <div>
                            <h3>
                                {weakestMetric.name}
                            </h3>

                            <span>
                                Current score:{" "}
                                {weakestMetric.score}/10
                            </span>

                            <p>
                                Focus on giving more complete and
                                well-supported answers in this area.
                            </p>
                        </div>

                    </div>


                    {improvementQuestions.map((question) => (

                        <div
                            className="improvement-card"
                            key={question.id}
                        >

                            <div className="improvement-icon">
                                !
                            </div>

                            <div>

                                <h3>
                                    {question.topic}
                                </h3>

                                <span>
                                    Question{" "}
                                    {question.question_number} ·{" "}
                                    {question.overall_score}/10
                                </span>

                                <p>
                                    {question.improvement}
                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            </section>


            {/* =========================
                CLOSING MESSAGE
            ========================= */}

            <section className="results-footer">

                <div className="footer-icon">
                    ✓
                </div>

                <h2>
                    Interview Complete
                </h2>

                <p>
                    You've completed your technical interview.
                    Use the feedback above to strengthen your
                    weaker areas and keep practicing.
                </p>

                <strong>
                    Good luck with your future interviews! 🚀
                </strong>

                <div className="footer-actions">
                    <Link to="/setup" className="btn btn-primary">
                        Start new interview
                    </Link>

                    <Link to="/history" className="btn">
                        View history
                    </Link>
                </div>

            </section>

        </div>
    );
}

export default ResultsDashboard;
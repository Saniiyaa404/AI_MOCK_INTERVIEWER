import { useState, useRef } from "react";
import ResultsDashboard from "./ResultsDashboard";
import { 
  startInterview, 
  generateQuestion,
  evaluateAnswer,
  generateAdaptiveQuestion,
  generateTopicPlan,
  startInterviewInDatabase,
  saveQuestionToDatabase,
  saveAnswerToDatabase,
  completeInterviewInDatabase
 } from "../services/api";

function InterviewSetup({ resumeText, resumeId }) {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [currentDifficulty, setCurrentDifficulty] = useState("");
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [topicPlan, setTopicPlan] = useState(null);
  const [coveredTopics, setCoveredTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [topicQuestionCount, setTopicQuestionCount] = useState({});
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [questionId, setQuestionId] = useState(null);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const isGeneratingNextQuestionRef = useRef(false);


  const handleStartInterview = async () => {
    if (!role) {
        setMessage("Please enter a job role.");
        return;
    }

    if (!resumeText) {
        setMessage("Please upload your resume first.");
        return;
    }

    // Reset previous interview state
    setQuestion("");
    setAnswer("");
    setEvaluation(null);
    setQuestionNumber(1);

    setInterviewHistory([]);
    setTopicPlan(null);
    setCoveredTopics([]);
    setCurrentTopic("");

    setTopicQuestionCount({});
    setFollowUpUsed(false);
    setCurrentDifficulty(difficulty);
    setInterviewId(null);
    setInterviewCompleted(false);

    try {
        const dbData = await startInterviewInDatabase(
            role,
            difficulty,
            resumeId
        );

        setInterviewId(dbData.interview.id);

        const plan = await generateTopicPlan(
            resumeText,
            role,
            difficulty
        );

        setTopicPlan(plan);

        const data = await generateQuestion(
            resumeText,
            role,
            difficulty,
            plan
        );

        const savedQuestion = await saveQuestionToDatabase(
            dbData.interview.id,
            1,
            data.topic,
            difficulty,
            false,
            data.question
        );

        setQuestionId(savedQuestion.question.id);

        setQuestion(data.question);
        setCurrentTopic(data.topic);

        setTopicQuestionCount((previousCounts) => ({
            ...previousCounts,
            [data.topic]: (previousCounts[data.topic] || 0) + 1
        }));

        setMessage("Interview started!");
    } catch (error) {
        console.error("START INTERVIEW ERROR:", error);
        setMessage(
        error.message || "Failed to start interview."
    );
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
        setMessage("Please enter your answer.");
        return;
    }

    try {
        setMessage("Evaluating answer...");
        
        // Start timing the evaluation process
        const evaluationStartTime = performance.now();

        const data = await evaluateAnswer(
            question,
            answer,
            role,
            currentDifficulty
        );

        // End timing the evaluation process
        const evaluationEndTime = performance.now();

        console.log(
            `⏱️ Evaluation API took ${(
                evaluationEndTime - evaluationStartTime
            ).toFixed(0)} ms`
        );

        setEvaluation(data.evaluation);
        
        // Start timing the database save process
        const dbStartTime = performance.now();

        await saveAnswerToDatabase(
            interviewId,
            questionId,
            answer,
            data.evaluation.technicalAccuracy,
            data.evaluation.completeness,
            data.evaluation.communicationClarity,
            data.evaluation.overallScore,
            data.evaluation.feedback,
            data.evaluation.improvement
        );

        // End timing the database save process
        const dbEndTime = performance.now();

        console.log(
            `⏱️ Answer DB save took ${(
                dbEndTime - dbStartTime
            ).toFixed(0)} ms`
        );
        
        //save question, topic, answer and evaluation
        setInterviewHistory((previousHistory) => [
          ...previousHistory,
          {
            question: question,
            topic: currentTopic,
            difficulty: currentDifficulty,
            isFollowUp: followUpUsed,
            answer: answer,
            evaluation: data.evaluation
          }
        ]);

        //Mark the current topic as covered
        const overallScore = data.evaluation.overallScore;

        if (overallScore >= 7) {
            setCoveredTopics((previousTopics) => {
                if (previousTopics.includes(currentTopic)) {
                    return previousTopics;
                }

                return [...previousTopics, currentTopic];
            });
        }

        setMessage("Answer evaluated!");
    } catch (error) {
        console.error(error);
        setMessage("Failed to evaluate answer.");
    }
  };

    const selectNextTopic = (
        latestScore,
        currentTopic,
        topicPlan,
        topicQuestionCount,
        followUpUsed
    ) => {
        if (!topicPlan || !topicPlan.topics) {
            return null;
        }

        const currentTopicCount =
            topicQuestionCount[currentTopic] || 0;

        // 1. WEAK ANSWER → allow ONE follow-up
        if (
            latestScore < 7 &&
            !followUpUsed &&
            currentTopicCount < 2
        ) {
            return {
                topic: currentTopic,
                isFollowUp: true
            };
        }

        // 2. Find topics that have NEVER been asked
        const newTopics = topicPlan.topics.filter((topic) => {
            const count =
                topicQuestionCount[topic.name] || 0;

            return count === 0;
        });

        // 3. Among new topics, prioritize HIGH → MEDIUM → LOW
        if (newTopics.length > 0) {
            const priorityOrder = {
                high: 1,
                medium: 2,
                low: 3
            };

            newTopics.sort(
                (a, b) =>
                    priorityOrder[a.priority] -
                    priorityOrder[b.priority]
            );

            return {
                topic: newTopics[0].name,
                isFollowUp: false
            };
        }

        // 4. No new topics remain.
        //    Reuse topics that have been asked exactly once.
        const reusableTopics = topicPlan.topics.filter((topic) => {
            const count =
                topicQuestionCount[topic.name] || 0;

            return count === 1;
        });

        // 5. Prioritize reusable topics by priority
        if (reusableTopics.length > 0) {
            const priorityOrder = {
                high: 1,
                medium: 2,
                low: 3
            };

            reusableTopics.sort(
                (a, b) =>
                    priorityOrder[a.priority] -
                    priorityOrder[b.priority]
            );

            return {
                topic: reusableTopics[0].name,
                isFollowUp: false
            };
        }

        // 6. Every topic has already been asked twice
        return null;
    };

    const selectNextDifficulty = (
        latestScore,
        currentDifficulty,
        baselineDifficulty,
        currentQuestionWasFollowUp
    ) => {

        // If the current question was a follow-up,
        // the next new topic returns to baseline.
        if (currentQuestionWasFollowUp) {
            return baselineDifficulty;
        }

        // If the current question was already an
        // adaptive difficulty question (different from baseline),
        // do NOT let its score propagate further.
        // Return to baseline for the next new topic.
        if (currentDifficulty !== baselineDifficulty) {
            return baselineDifficulty;
        }

        // From this point onward, the current question
        // is a baseline-difficulty question.

        // Score below 4 → one level below baseline
        if (latestScore < 4) {

            if (baselineDifficulty === "Hard") {
                return "Medium";
            }

            if (baselineDifficulty === "Medium") {
                return "Easy";
            }

            return "Easy";
        }

        // Score 4 to 8.5 → stay at baseline
        if (latestScore <= 8.5) {
            return baselineDifficulty;
        }

        // Score above 8.5 → one level above baseline
        if (baselineDifficulty === "Easy") {
            return "Medium";
        }

        if (baselineDifficulty === "Medium") {
            return "Hard";
        }

        return "Hard";
    };

    const handleSubmitInterview = async () => {
        if (!interviewId) {
            return;
        }

        if (!evaluation) {
            setMessage("Please submit your current answer first.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to submit the interview?\n\n" +
            "You will not be able to continue answering questions after submission."
        );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("Completing interview...");

            await completeInterviewInDatabase(interviewId);

            setInterviewCompleted(true);
            setMessage("Interview completed!");

        } catch (error) {
            console.error("SUBMIT INTERVIEW ERROR:", error);

            setMessage(
                error.message || "Failed to complete interview."
            );
        }
    };

    const handleNextQuestion = async () => {

        if (isGeneratingNextQuestionRef.current) {
            return;
        }

        isGeneratingNextQuestionRef.current = true;
        
        if (questionNumber >= 10) {
            try {
                setMessage("Completing interview...");

                await completeInterviewInDatabase(interviewId);

                setMessage("Interview completed!");

                setInterviewCompleted(true);
            } catch (error) {
                console.error(error);
                setMessage("Failed to complete interview.");
            } finally {
                isGeneratingNextQuestionRef.current = false;
            }

            return;
        }

        if (!evaluation) {
            setMessage("Please submit and evaluate your answer first.");
            return;
        }

        try {
            setMessage("Selecting next topic...");

            // Use the evaluation of the currently answered question
            const latestScore =
                evaluation?.overallScore ?? 0;

            const latestItem =
                interviewHistory[interviewHistory.length - 1];

            const currentQuestionWasFollowUp = followUpUsed;

            // Application decides the next topic
            const nextTopic = selectNextTopic(
                latestScore,
                currentTopic,
                topicPlan,
                topicQuestionCount,
                followUpUsed
            );

            if (!nextTopic) {
                setMessage("No more topics available.");
                return;
            }
            
            //debugging and testing
            console.log("========== NEXT QUESTION DEBUG ==========");
            console.log("Current Topic:", currentTopic);
            console.log("Current Topic Count:", topicQuestionCount[currentTopic] || 0);
            console.log("Latest Score:", latestScore);
            console.log("Follow-up Used:", followUpUsed);
            console.log("Topic Question Counts:", topicQuestionCount);
            console.log("Selected Next Topic:", nextTopic);
            console.log("=========================================");

            const nextDifficulty = selectNextDifficulty(
                latestScore,
                currentDifficulty,
                difficulty,
                currentQuestionWasFollowUp
            );

            // Track whether this next question is a follow-up
            setFollowUpUsed(nextTopic.isFollowUp);

            setMessage(
                nextTopic.isFollowUp
                    ? "Generating follow-up question..."
                    : "Generating question on a new topic..."
            );

            // Gemini gets previous answer/evaluation
            // ONLY when generating a follow-up question.
            const latestItemForGemini =
                nextTopic.isFollowUp ? latestItem : null;

            // Start timing the question generation process
            const questionStartTime = performance.now();

            // Gemini ONLY generates the question
            // for the topic selected by the application.
            const data = await generateAdaptiveQuestion(
                role,
                nextDifficulty,
                nextTopic.topic,
                latestItemForGemini
            );
            
            // End timing the question generation process
            const questionEndTime = performance.now();

            console.log(
                `⏱️ Question generation API took ${(
                    questionEndTime - questionStartTime
                ).toFixed(0)} ms`
            );

            //save generated question to database
            const nextQuestionNumber = questionNumber + 1;

            // Start timing the question database save process
            const questionDbStartTime = performance.now();

            const savedQuestion = await saveQuestionToDatabase(
                interviewId,
                nextQuestionNumber,
                nextTopic.topic,
                nextDifficulty,
                nextTopic.isFollowUp,
                data.question
            );

            // End timing the question database save process
            const questionDbEndTime = performance.now();

            console.log(
                `⏱️ Question DB save took ${(
                    questionDbEndTime - questionDbStartTime
                ).toFixed(0)} ms`
            );

            setQuestionId(savedQuestion.question.id);
                        
            //debugging and testing
            console.log("========== GEMINI RESPONSE ==========");
            console.log("Application Selected Topic:", nextTopic.topic);
            console.log("Application Selected Difficulty:", nextDifficulty);
            console.log("Gemini Returned Topic:", data.topic);
            console.log("Gemini Returned Difficulty:", data.difficulty);
            console.log("Gemini Question:", data.question);
            console.log("====================================");

            setQuestion(data.question);

            // Use the topic selected by the application,
            // not Gemini's returned topic.
            setCurrentTopic(nextTopic.topic);
            setCurrentDifficulty(nextDifficulty);

            // Increment question count for selected topic
            setTopicQuestionCount((previousCounts) => ({
                ...previousCounts,
                [nextTopic.topic]:
                    (previousCounts[nextTopic.topic] || 0) + 1
            }));

            setQuestionNumber(
                (previousNumber) => previousNumber + 1
            );

            // Clear previous answer and evaluation
            setAnswer("");
            setEvaluation(null);

            setMessage("Next question ready!");

        } catch (error) {
            console.error(error);
            setMessage("Failed to generate next question.");
        } finally {
            isGeneratingNextQuestionRef.current = false;
        }
    };

    if (interviewCompleted && interviewId) {
        return (
            <ResultsDashboard
                interviewId={interviewId}
            />
        );
    }

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
        {topicPlan && (
            <div>
                <h3>Interview Topic Plan</h3>

                <ul>
                    {topicPlan.topics.map((topic, index) => (
                        <li key={index}>
                            <strong>{topic.name}</strong>
                            {" - "}
                            {topic.priority}
                            <br />
                            {topic.reason}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        
        {question && (
            <div>
                <h3>
                    Question {questionNumber} of 10
                </h3>

                <p>
                    <strong>Topic:</strong> {currentTopic}
                </p>

                <p>
                    <strong>Difficulty:</strong> {currentDifficulty}
                </p>

                <p>
                    <strong>Type:</strong>{" "}
                    {followUpUsed ? "Follow-up" : "Normal"}
                </p>

                {coveredTopics.filter(Boolean).length > 0 && (
                    <div>
                        <h3>Covered Topics</h3>

                        <ul>
                            {coveredTopics
                                .filter(Boolean)
                                .map((topic, index) => (
                                    <li key={index}>{topic}</li>
                                ))}
                        </ul>
                    </div>
                )}

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

                {evaluation && (
                    <>
                        <button onClick={handleNextQuestion}>
                            {questionNumber >= 10 ? "Finish Interview" : "Next Question"}
                        </button>

                        {questionNumber < 10 && (
                            <button
                                onClick={handleSubmitInterview}
                                className="submit-interview-button"
                            >
                                Submit Interview
                            </button>
                        )}
                    </>
                )}
                
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

        {interviewHistory.length > 0 && (
        <div>
            <h3>Interview History</h3>

            {interviewHistory.map((item, index) => (
                <div key={index}>
                    <h4>Question {index + 1}</h4>

                    <p>
                        <strong>Question:</strong>{" "}
                        {item.question}
                    </p>

                    <p>
                        <strong>Your Answer:</strong>{" "}
                        {item.answer}
                    </p>

                    <p>
                        <strong>Overall Score:</strong>{" "}
                        {item.evaluation.overallScore}/10
                    </p>

                    <p>
                        <strong>Type:</strong>{" "}
                        {item.isFollowUp ? "Follow-up" : "Normal"}
                    </p>

                    <hr />
                </div>
            ))}
        </div>
        )}

        </div>
    );
}

export default InterviewSetup;
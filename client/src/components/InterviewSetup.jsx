import { useState } from "react";
import { 
  startInterview, 
  generateQuestion,
  evaluateAnswer,
  generateAdaptiveQuestion,
  generateTopicPlan
 } from "../services/api";

function InterviewSetup({ resumeText }) {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
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


  const handleStartInterview = async () => {
    if (!role) {
        setMessage("Please enter a job role.");
        return;
    }

    if (!resumeText) {
        setMessage("Please upload your resume first.");
        return;
    }

    try {
        // await startInterview(role, difficulty);

        // const data = await generateQuestion(
        //     resumeText,
        //     role,
        //     difficulty
        // );

        // setQuestion(data.question);

        await startInterview(role, difficulty);

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

        const data = await evaluateAnswer(
            question,
            answer,
            role,
            difficulty
        );

        setEvaluation(data.evaluation);
        
        //save question, topic, answer and evaluation
        setInterviewHistory((previousHistory) => [
          ...previousHistory,
          {
            question: question,
            topic: currentTopic,
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

        // --------------------------------------------------
        // 1. WEAK ANSWER → allow ONE follow-up
        // --------------------------------------------------
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

        // --------------------------------------------------
        // 2. GOOD ANSWER OR FOLLOW-UP ALREADY USED
        //    → find a topic that has NEVER been asked
        // --------------------------------------------------
        const newTopic = topicPlan.topics.find((topic) => {
            const count =
                topicQuestionCount[topic.name] || 0;

            return count === 0;
        });

        if (newTopic) {
            return {
                topic: newTopic.name,
                isFollowUp: false
            };
        }

        // --------------------------------------------------
        // 3. No completely new topics remain.
        //    Use a topic that has been asked ONCE.
        // --------------------------------------------------
        const reusableTopic = topicPlan.topics.find((topic) => {
            const count =
                topicQuestionCount[topic.name] || 0;

            return count === 1;
        });

        if (reusableTopic) {
            return {
                topic: reusableTopic.name,
                isFollowUp: false
            };
        }

        // --------------------------------------------------
        // 4. Every topic has already been asked twice.
        // --------------------------------------------------
        return null;
    };

    const handleNextQuestion = async () => {
        if (questionNumber >= 10) {
            setMessage("Interview completed!");
            return;
        }

        try {
            setMessage("Selecting next topic...");

            // Get the latest evaluation
            const latestItem =
                interviewHistory[interviewHistory.length - 1];

            const latestScore =
                latestItem?.evaluation?.overallScore ?? 0;

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

            // Gemini ONLY generates the question
            // for the topic selected by the application.
            const data = await generateAdaptiveQuestion(
                role,
                difficulty,
                nextTopic.topic,
                latestItemForGemini
            );

            setQuestion(data.question);

            // Use the topic selected by the application,
            // not Gemini's returned topic.
            setCurrentTopic(nextTopic.topic);

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

          //temporary testing
          <p>
            <strong>Topic:</strong> {currentTopic}
          </p>

          {coveredTopics.length > 0 && (
            <div>
                <h3>Covered Topics</h3>

                <ul>
                    {coveredTopics.map((topic, index) => (
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
            <button onClick={handleNextQuestion}>
              Next Question
            </button>
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

                  <hr />
              </div>
          ))}
      </div>
      )}

    </div>
  );
}

export default InterviewSetup;
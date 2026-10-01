const express = require("express");
const { 
    testAI, 
    testGemini,
    generateQuestion,
    evaluateAnswer,
    generateAdaptiveQuestion,
    generateTopicPlan
 } = require("../services/aiService");

const {
    createInterview,
    createQuestion,
    createAnswer,
    completeInterview,
    getInterviewResults,
    getInterviewHistory
} = require("../services/interviewDbService");

const router = express.Router();

router.post("/start", async (req, res) => {
    try {
        const { role, difficulty, resumeId } = req.body;

        if (!role || !difficulty || !resumeId) {
            return res.status(400).json({
                message: "Role and difficulty are required."
            });
        }

        const interview = await createInterview(
            role,
            difficulty,
            resumeId
        );

        res.status(201).json({
            message: "Interview started",
            interview
        });

    } catch (error) {
        console.error("CREATE INTERVIEW ERROR:", error);

        res.status(500).json({
            message: "Failed to create interview."
        });
    }
});

router.post("/:interviewId/questions", async (req, res) => {
    try {
        const { interviewId } = req.params;

        const {
            questionNumber,
            topic,
            difficulty,
            isFollowUp,
            questionText
        } = req.body;

        if (
            !interviewId ||
            !questionNumber ||
            !topic ||
            !difficulty ||
            !questionText
        ) {
            return res.status(400).json({
                message: "Missing required question data."
            });
        }

        const question = await createQuestion(
            interviewId,
            questionNumber,
            topic,
            difficulty,
            isFollowUp || false,
            questionText
        );

        res.status(201).json({
            message: "Question saved successfully",
            question
        });

    } catch (error) {
        console.error("CREATE QUESTION ERROR:", error);

        res.status(500).json({
            message: "Failed to save question."
        });
    }
});

router.post("/:interviewId/answers", async (req, res) => {
    try {
        const {
            questionId,
            answerText,
            technicalAccuracy,
            completeness,
            communicationClarity,
            overallScore,
            feedback,
            improvement
        } = req.body;

        if (
            !questionId ||
            !answerText ||
            technicalAccuracy === undefined ||
            completeness === undefined ||
            communicationClarity === undefined ||
            overallScore === undefined
        ) {
            return res.status(400).json({
                message: "Missing required answer data."
            });
        }

        const answer = await createAnswer(
            questionId,
            answerText,
            technicalAccuracy,
            completeness,
            communicationClarity,
            overallScore,
            feedback,
            improvement
        );

        res.status(201).json({
            message: "Answer saved successfully",
            answer
        });

    } catch (error) {
        console.error("CREATE ANSWER ERROR:", error);

        res.status(500).json({
            message: "Failed to save answer."
        });
    }
});

router.patch("/:interviewId/complete", async (req, res) => {
    try {
        const { interviewId } = req.params;

        if (!interviewId) {
            return res.status(400).json({
                message: "Interview ID is required."
            });
        }

        const interview = await completeInterview(interviewId);

        res.status(200).json({
            message: "Interview completed successfully",
            interview
        });

    } catch (error) {
        console.error("COMPLETE INTERVIEW ERROR:", error);

        res.status(500).json({
            message: "Failed to complete interview."
        });
    }
});

// List of all interviews for the History page
router.get("/history", async (req, res) => {
    try {
        const interviews = await getInterviewHistory();

        res.json({ interviews });

    } catch (error) {
        console.error("GET INTERVIEW HISTORY ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch interview history."
        });
    }
});

router.get("/:interviewId/results", async (req, res) => {
    try {
        const { interviewId } = req.params;

        const results = await getInterviewResults(interviewId);

        res.json(results);

    } catch (error) {
        console.error("GET INTERVIEW RESULTS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch interview results."
        });
    }
});

router.get("/test-ai", async(req, res) => {
    try{
        const result = await testAI();

        res.json({
            message: result
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "AI request failed"
        });
    }
});

//testing gemini 
router.get("/test-gemini", async (req, res) => {
    try{
        const result = await testGemini();
        res.json({ result });
    } catch (error) {
        console.error("Gemini test error:", error);
        res.status(500).json({
            message: "Gemini test failed",
            error: error.message
        });
    }
});

router.get("/test-question", async (req, res) => {
    try {
        const result = await generateQuestion(
            "Candidate has experience with Node.js, Express.js, MongoDB and REST APIs.",
            "Backend Developer",
            "Medium",
            {
                topics: [
                    {
                        name: "Node.js",
                        priority: "High",
                        reason: "Important backend technology"
                    },
                    {
                        name: "REST API Design",
                        priority: "High",
                        reason: "Important for backend development"
                    },
                    {
                        name: "MongoDB",
                        priority: "Medium",
                        reason: "Database knowledge"
                    }
                ]
            }
        );

        res.json(result);

    } catch (error) {
        console.error("Test question error:", error);

        res.status(500).json({
            message: "Question generation failed",
            error: error.message
        });
    }
});

router.post("/generate-question", async (req, res) => {
    try {
        const { resumeText, role, difficulty, topicPlan } = req.body;

        const question = await generateQuestion(
            resumeText,
            role,
            difficulty,
            topicPlan
        );

        res.json(question);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to generate question."
        });
    }
});

router.post("/evaluate-answer", async (req, res) => {
    try {
        const {
            question,
            answer,
            role,
            difficulty
        } = req.body;

        const evaluation = await evaluateAnswer(
            question,
            answer,
            role,
            difficulty
        );

        res.json({
            evaluation
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to evaluate answer."
        });
    }
});

router.post("/generate-adaptive-question", async (req, res) => {
    try {
        const {
            role,
            difficulty,
            selectedTopic,
            latestItem
        } = req.body;

        const question = await generateAdaptiveQuestion(
            role,
            difficulty,
            selectedTopic,
            latestItem
        );

        res.json(question);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to generate adaptive question."
        });
    }
});


// for temporary testing
router.post("/generate-topic-plan", async (req, res) => {
    try {
        const {
            resumeText,
            role,
            difficulty
        } = req.body;

        const topicPlan = await generateTopicPlan(
            resumeText,
            role,
            difficulty
        );

        res.json(topicPlan);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to generate topic plan."
        });
    }
});

module.exports = router;
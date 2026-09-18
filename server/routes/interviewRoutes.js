const express = require("express");
const { 
    testAI, 
    testGemini,
    generateQuestion,
    evaluateAnswer,
    generateAdaptiveQuestion,
    generateTopicPlan
 } = require("../services/aiService");

const router = express.Router();

router.post("/start", (req, res) => {
    const { role, difficulty } = req.body;

    res.json({
        message: "Interview started",
        role: role,
        difficulty: difficulty
    });
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
            resumeText,
            role,
            difficulty,
            interviewHistory,
            topicPlan,
            coveredTopics
        } = req.body;

        const question = await generateAdaptiveQuestion(
            resumeText,
            role,
            difficulty,
            interviewHistory,
            topicPlan,
            coveredTopics
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
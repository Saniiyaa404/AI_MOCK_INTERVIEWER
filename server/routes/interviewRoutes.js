const express = require("express");
const { 
    testAI, 
    generateQuestion,
    evaluateAnswer
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

router.post("/generate-question", async (req, res) => {
    try {
        const { resumeText, role, difficulty } = req.body;

        const question = await generateQuestion(
            resumeText,
            role,
            difficulty
        );

        res.json({
            question
        });

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

module.exports = router;
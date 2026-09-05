const express = require("express");

const router = express.Router();

router.post("/start", (req, res) => {
    const { role, difficulty } = req.body;

    res.json({
        message: "Interview started",
        role: role,
        difficulty: difficulty
    });
});

module.exports = router;
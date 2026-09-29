const openAI = require("openai");

const client = new openAI({
    apiKey: process.env.OPENAI_API_KEY
});

//Gemini API client
const { GoogleGenAI } = require("@google/genai");

const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testAI(){
    const response = await client.responses.create({
        model: "gpt-5.6-luna",
        max_output_tokens: 1200,
        input: "Say hello in one short sentence"
    });

    return response.output_text;
}

//for testing Gemini API
async function testGemini() {
    const response = await geminiClient.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: "Say hello in one short sentence."
    });

    console.log("Gemini response:", response.text);

    return response.text;
}

function getDifficultyInstructions(difficulty) {
    if (difficulty === "Easy") {
        return `
Difficulty Level: EASY

The question should:
- Test fundamental technical concepts.
- Focus on basic definitions, core concepts, and simple practical understanding.
- Require straightforward reasoning.
- Avoid complex edge cases, advanced optimization, or system design.
- Be answerable by a candidate with basic knowledge of the topic.
`;
    }

    if (difficulty === "Medium") {
        return `
Difficulty Level: MEDIUM

The question should:
- Test practical and intermediate technical understanding.
- Require the candidate to explain how concepts work and apply them.
- Include moderate reasoning or implementation considerations.
- May involve debugging, trade-offs, architecture decisions, or practical scenarios.
- Should not require highly advanced optimization or deep system design.
`;
    }

    if (difficulty === "Hard") {
        return `
Difficulty Level: HARD

The question should:
- Test deep technical understanding.
- Require multi-step reasoning and strong practical knowledge.
- Include complex scenarios, edge cases, trade-offs, optimization, architecture, or debugging.
- Require the candidate to explain WHY a particular approach is appropriate.
- Should distinguish an advanced candidate from someone with only basic knowledge.
`;
    }

    return `
Use the selected difficulty level exactly as provided.
`;
}

async function generateContentWithRetry(request, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await geminiClient.models.generateContent(request);
        } catch (error) {
            lastError = error;

            const statusCode =
                error?.status ||
                error?.code ||
                error?.error?.code;

            const isRetryable =
                statusCode === 429 ||
                statusCode === 500 ||
                statusCode === 502 ||
                statusCode === 503 ||
                statusCode === 504;

            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            const delay = Math.min(
                1000 * Math.pow(2, attempt),
                8000
            );

            console.log(
                `Gemini request failed (${statusCode}). ` +
                `Retrying in ${delay}ms... ` +
                `Attempt ${attempt + 1}/${maxRetries}`
            );

            await new Promise((resolve) =>
                setTimeout(resolve, delay)
            );
        }
    }

    throw lastError;
}

async function generateQuestion(
    resumeText,
    role,
    difficulty,
    topicPlan = null
) {
    const topicPlanText = topicPlan
        ? topicPlan.topics
            .map(
                (topic, index) =>
                    `${index + 1}. ${topic.name} (${topic.priority}) - ${topic.reason}`
            )
            .join("\n")
        : "No topic plan provided.";

const difficultyInstructions =
    getDifficultyInstructions(difficulty);

const prompt = `
You are a technical interviewer.

Generate ONE technical interview question for the candidate.

Candidate Role:
${role}

Selected Difficulty:
${difficulty}

${difficultyInstructions}

Candidate Resume:
${resumeText}

Interview Topic Plan:
${topicPlanText}

The topic plan was dynamically generated from the candidate's
resume and selected job role.

Your task is to select ONE appropriate topic from the provided
topic plan and generate ONE technical interview question about it.

Rules:

1. The selected topic MUST come from the provided Interview Topic Plan.

2. Generate exactly ONE technical interview question.

3. Do not invent a new topic that is not present in the topic plan.

4. Do not focus the entire interview on the candidate's projects.

5. Project-specific questions are allowed, but technical skills,
   programming languages, frameworks, databases, core CS concepts,
   problem solving, security, testing, system design, and other
   relevant topics from the topic plan should also be considered.

6. Match the question to the selected difficulty level.

7. Prioritize high-priority topics when appropriate.

8. If this is the first question, choose an appropriate high-priority
   topic from the topic plan.

9. The question should test actual technical understanding rather
   than simply asking the candidate to describe their resume.

10. Do not provide the answer.

11. Return the selected topic using EXACTLY the same topic name
    provided in the Interview Topic Plan.

12. Return the difficulty as exactly the selected difficulty level.

13. Do not change the difficulty level.
`;

    const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",
                properties: {
                    question: {
                        type: "string"
                    },
                    topic: {
                        type: "string"
                    },
                    difficulty: {
                        type: "string",
                        enum: ["Easy", "Medium", "Hard"]
                    }
                },
                required: ["question", "topic", "difficulty"]
            },

            maxOutputTokens: 500
        }
    });

    try {
        const result = JSON.parse(response.text);

        if (result.difficulty !== difficulty) {
            throw new Error(
                `Difficulty mismatch: expected ${difficulty}, got ${result.difficulty}`
            );
        }

        return result;
    } catch (error) {
        console.error("Invalid JSON received from Gemini:");
        console.error(response.text);
        throw new Error(
            "Gemini returned an invalid interview question response."
        );
    }
}

async function evaluateAnswer(
    question,
    answer,
    role,
    difficulty
) {
    const prompt = `
You are a technical interviewer evaluating a candidate's answer.

Candidate Role: ${role}
Interview Difficulty: ${difficulty}

Question:
${question}

Candidate Answer:
${answer}

Evaluate the candidate based on:

1. Technical Accuracy
2. Completeness
3. Communication Clarity

Scoring:
- Each category must be scored from 0 to 10.
- Overall score must be from 0 to 10.
- Be fair and evaluate only what the candidate actually said.
- Do not give credit for information that was not provided.
- Feedback should be concise and useful.
- Improvement should identify one specific thing the candidate can improve.

Return ONLY the required JSON object.
`;

    const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",

                properties: {
                    technicalAccuracy: {
                        type: "number"
                    },

                    completeness: {
                        type: "number"
                    },

                    communicationClarity: {
                        type: "number"
                    },

                    overallScore: {
                        type: "number"
                    },

                    feedback: {
                        type: "string"
                    },

                    improvement: {
                        type: "string"
                    }
                },

                required: [
                    "technicalAccuracy",
                    "completeness",
                    "communicationClarity",
                    "overallScore",
                    "feedback",
                    "improvement"
                ]
            },

            maxOutputTokens: 800
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Invalid JSON received from Gemini:");
        console.error(response.text);

        throw new Error(
            "Gemini returned an invalid evaluation response."
        );
    }
}

async function generateAdaptiveQuestion(
        role,
        difficulty,
        selectedTopic,
        latestItem = null
    ) {
        const followUpContext = latestItem
            ? `
    Previous Question:
    ${latestItem.question}

    Candidate's Answer:
    ${latestItem.answer}

    Previous Evaluation:
    Technical Accuracy: ${latestItem.evaluation.technicalAccuracy}/10
    Completeness: ${latestItem.evaluation.completeness}/10
    Communication Clarity: ${latestItem.evaluation.communicationClarity}/10
    Overall Score: ${latestItem.evaluation.overallScore}/10

    Feedback:
    ${latestItem.evaluation.feedback}

    Improvement:
    ${latestItem.evaluation.improvement}
    `
            : "";

    const difficultyInstructions =
        getDifficultyInstructions(difficulty);

    const prompt = `
    You are a technical interviewer.

    Candidate Role:
    ${role}

    Selected Interview Difficulty:
    ${difficulty}

    ${difficultyInstructions}

    Selected Interview Topic:
    ${selectedTopic}

    Generate ONE technical interview question specifically about
    the selected topic.

    ${followUpContext}

    Rules:

    1. The question MUST be about the selected topic.

    2. Do NOT select or change the topic.

    3. Do NOT introduce a different topic.

    4. Match the question to the selected difficulty level.

    5. If previous question and evaluation are provided, use them
    to create a meaningful follow-up question that addresses
    the candidate's weakness.

    6. If no previous question is provided, generate a normal
    question about the selected topic.

    7. Do not provide the answer.

    8. Generate exactly ONE question.

    9. The question MUST match the selected difficulty level.

    10. Do not make the question easier or harder than the selected difficulty.

    11. Return the difficulty as exactly the selected difficulty level.

    Return ONLY the required JSON object.
    `;

        const response = await generateContentWithRetry({
            model: "gemini-3.1-flash-lite",
            contents: prompt,

            config: {
                responseMimeType: "application/json",

                responseSchema: {
                    type: "object",
                    properties: {
                        question: {
                            type: "string"
                        },
                        topic: {
                            type: "string"
                        },
                        difficulty: {
                            type: "string",
                            enum: ["Easy", "Medium", "Hard"]
                        }
                    },
                    required: ["question", "topic", "difficulty"]
                },

                maxOutputTokens: 300
            }
        });

    try {
        const result = JSON.parse(response.text);

        if (result.difficulty !== difficulty) {
            throw new Error(
                `Difficulty mismatch: expected ${difficulty}, got ${result.difficulty}`
            );
        }

        if (result.topic !== selectedTopic) {
            throw new Error(
                `Topic mismatch: expected ${selectedTopic}, got ${result.topic}`
            );
        }

        return result;

    } catch (error) {
        console.error("Invalid response received from Gemini:");
        console.error(response.text);

        throw new Error(
            "Gemini returned an invalid adaptive question response."
        );
    }
}

async function generateTopicPlan(
    resumeText,
    role,
    difficulty
) {
    const prompt = `
You are an expert technical interview planner.

Create a dynamic technical interview topic plan for a candidate.

Candidate Role:
${role}

Interview Difficulty:
${difficulty}

Candidate Resume:
${resumeText}

Your task is to analyze the candidate's resume and determine
which technical areas should be covered during the interview.

Consider:
- Technical skills explicitly listed in the resume
- Programming languages
- Frameworks and libraries
- Databases and other technologies
- Projects and technical experience
- Core computer science concepts relevant to the candidate
- Problem-solving and programming fundamentals
- System/API design when relevant
- Security, testing, performance, or other relevant areas
- Requirements and expectations of the selected job role

Important rules:

1. The plan must be specific to this candidate's resume and
   selected role.

2. Do not assume technologies that are not present in the resume
   unless they are fundamental to the selected role.

3. Do not focus the entire interview on one project.

4. Projects should be included as interview areas, but the plan
   should also cover relevant technical skills and concepts.

5. Prioritize topics based on:
   - relevance to the selected role
   - evidence in the candidate's resume
   - importance for evaluating technical ability

6. Avoid duplicate or nearly identical topics.

7. Create enough diverse topics to support a 10-question interview.

8. A topic can represent a broader area when appropriate.
   For example, "JavaScript Fundamentals" is preferable to creating
   separate topics for every small JavaScript concept.

9. Do not create a fixed universal list of topics. The topic plan
   must be generated dynamically from the candidate's information.

Return ONLY the required JSON object.
`;

    const response = await generateWithRetry({
        model: "gemini-3.1-flash-lite",

        contents: prompt,

        config: {
            responseMimeType: "application/json",

            responseSchema: {
                type: "object",

                properties: {
                    topics: {
                        type: "array",

                        items: {
                            type: "object",

                            properties: {
                                name: {
                                    type: "string"
                                },

                                priority: {
                                    type: "string",
                                    enum: [
                                        "high",
                                        "medium",
                                        "low"
                                    ]
                                },

                                reason: {
                                    type: "string"
                                }
                            },

                            required: [
                                "name",
                                "priority",
                                "reason"
                            ]
                        }
                    }
                },

                required: [
                    "topics"
                ]
            },

            maxOutputTokens: 1200
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Invalid JSON received from Gemini:");
        console.error(response.text);

        throw new Error(
            "Gemini returned an invalid topic plan response."
        );
    }
}

async function generateWithRetry(request) {
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await geminiClient.models.generateContent(request);
        } catch (error) {
            const status = error?.status || error?.code;

            if (status !== 503 || attempt === maxAttempts) {
                throw error;
            }

            const delay = 1000 * Math.pow(2, attempt - 1);

            console.log(
                `Gemini temporarily unavailable. ` +
                `Retrying in ${delay}ms... ` +
                `Attempt ${attempt}/${maxAttempts}`
            );

            await new Promise((resolve) =>
                setTimeout(resolve, delay)
            );
        }
    }
}

module.exports = {
    testAI,
    testGemini,
    generateQuestion,
    evaluateAnswer,
    generateAdaptiveQuestion,
    generateTopicPlan
};
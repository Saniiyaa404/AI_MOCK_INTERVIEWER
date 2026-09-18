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
        model: "gemini-3.5-flash-lite",
        contents: "Say hello in one short sentence."
    });

    console.log("Gemini response:", response.text);

    return response.text;
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

    const prompt = `
You are a technical interviewer.

Generate ONE technical interview question for the candidate.

Candidate Role:
${role}

Difficulty:
${difficulty}

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
`;

    const response = await geminiClient.models.generateContent({
        model: "gemini-3.5-flash-lite",

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
                    }
                },

                required: [
                    "question",
                    "topic"
                ]
            },

            maxOutputTokens: 500
        }
    });

    try {
        return JSON.parse(response.text);
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

    const response = await geminiClient.models.generateContent({
        model: "gemini-3.5-flash-lite",

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
    resumeText,
    role,
    difficulty,
    interviewHistory,
    topicPlan,
    coveredTopics
) {
    // Only send topic names and priorities.
    const topicPlanText = topicPlan
        ? topicPlan.topics
            .map(
                (topic, index) =>
                    `${index + 1}. ${topic.name} - ${topic.priority}`
            )
            .join("\n")
        : "No topic plan provided.";

    // Only send the last 3 questions to avoid repetition
    // and reduce token usage.
    const recentHistory = interviewHistory
        .slice(-3)
        .map((item, index) => `
Question ${index + 1}: ${item.question}
Topic: ${item.topic || "Unknown"}
Score: ${item.evaluation.overallScore}/10
`)
        .join("\n");

    // Latest evaluation is the most important information.
    const latestItem =
        interviewHistory.length > 0
            ? interviewHistory[interviewHistory.length - 1]
            : null;

    const latestEvaluation = latestItem
        ? `
Latest Question:
${latestItem.question}

Latest Answer:
${latestItem.answer}

Latest Topic:
${latestItem.topic || "Unknown"}

Latest Evaluation:
Technical Accuracy: ${latestItem.evaluation.technicalAccuracy}/10
Completeness: ${latestItem.evaluation.completeness}/10
Communication Clarity: ${latestItem.evaluation.communicationClarity}/10
Overall Score: ${latestItem.evaluation.overallScore}/10

Feedback:
${latestItem.evaluation.feedback}

Improvement:
${latestItem.evaluation.improvement}
`
        : "No previous answer. This is the first question.";

    const coveredTopicsText =
        coveredTopics && coveredTopics.length > 0
            ? coveredTopics.join("\n")
            : "None";

    const prompt = `
You are an adaptive technical interviewer.

Role: ${role}
Difficulty: ${difficulty}

Topic Plan:
${topicPlanText}

Adequately Covered Topics:
${coveredTopicsText}

Recent Questions:
${recentHistory || "None"}

${latestEvaluation}

Generate ONE technical interview question.

Rules:

1. If the latest overall score is below 7, prefer a focused follow-up
   that tests the specific weakness from the latest feedback.

2. If the latest score is 7 or higher, prefer a different uncovered topic.

3. Do not repeat a previous question or the same specific concept.

4. A topic with a score below 7 is NOT adequately covered.

5. Do not ask more than two consecutive questions about the same
   specific concept.

6. Prefer breadth across the topic plan.

7. Do not invent technologies outside the topic plan.

8. Match the selected difficulty.

9. Return the exact topic name from the topic plan.

10. Return ONLY the required JSON object.
`;

    const response = await geminiClient.models.generateContent({
        model: "gemini-3.5-flash-lite",

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
                    }
                },

                required: [
                    "question",
                    "topic"
                ]
            },

            maxOutputTokens: 300
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Invalid JSON received from Gemini:");
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

    const response = await geminiClient.models.generateContent({
        model: "gemini-3.5-flash-lite",

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

module.exports = {
    testAI,
    testGemini,
    generateQuestion,
    evaluateAnswer,
    generateAdaptiveQuestion,
    generateTopicPlan
};
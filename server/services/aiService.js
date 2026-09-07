const openAI = require("openai");

const client = new openAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testAI(){
    const response = await client.responses.create({
        model: "gpt-5.6-luna",
        input: "Say hello in one short sentence"
    });

    return response.output_text;
}

async function generateQuestion(resumeText, role, difficulty) {
    const response = await client.responses.create({
        model: "gpt-5.6-luna",
        input: `
You are a technical interviewer.

Generate ONE technical interview question for the candidate.

Candidate Role: ${role}
Difficulty: ${difficulty}

Candidate Resume:
${resumeText}

Requirements:
- The question must be relevant to the candidate's role.
- Use the candidate's resume when appropriate.
- Focus on technical knowledge.
- Do not provide the answer.
- Return only the interview question.
        `
    });

    return response.output_text;
}

async function evaluateAnswer(
    question,
    answer,
    role,
    difficulty
) {
    const response = await client.responses.create({
        model: "gpt-5.6-luna",

        input: `
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
        `,

        text: {
            format: {
                type: "json_schema",
                name: "answer_evaluation",
                strict: true,
                schema: {
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
                    ],
                    additionalProperties: false
                }
            }
        }
    });

    return JSON.parse(response.output_text);
}

module.exports = {
    testAI,
    generateQuestion,
    evaluateAnswer
};
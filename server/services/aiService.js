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

    const response = await client.responses.create({
        model: "gpt-5.6-luna",

        input: `
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

Return the result using the required JSON structure.
        `,

        text: {
            format: {
                type: "json_schema",
                name: "interview_question",
                strict: true,
                schema: {
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
                    ],
                    additionalProperties: false
                }
            }
        }
    });

    return JSON.parse(response.output_text);
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

async function generateAdaptiveQuestion(
    resumeText,
    role,
    difficulty,
    interviewHistory,
    topicPlan,
    coveredTopics
) {
    const historyText = interviewHistory
        .map((item, index) => `
Question ${index + 1}:
${item.question}

Topic:
${item.topic || "Unknown"}

Candidate Answer:
${item.answer}

Evaluation:
Technical Accuracy: ${item.evaluation.technicalAccuracy}/10
Completeness: ${item.evaluation.completeness}/10
Communication Clarity: ${item.evaluation.communicationClarity}/10
Overall Score: ${item.evaluation.overallScore}/10

Feedback:
${item.evaluation.feedback}

Improvement:
${item.evaluation.improvement}
        `)
        .join("\n");

    const topicPlanText = topicPlan
        ? topicPlan.topics
            .map((topic, index) =>
                `${index + 1}. ${topic.name} (${topic.priority}) - ${topic.reason}`
            )
            .join("\n")
        : "No topic plan provided.";

    const coveredTopicsText = coveredTopics &&
        coveredTopics.length > 0
        ? coveredTopics.join("\n")
        : "No topics covered yet.";

    const response = await client.responses.create({
        model: "gpt-5.6-luna",

        input: `
You are an adaptive technical interviewer.

Candidate Role:
${role}

Interview Difficulty:
${difficulty}

Candidate Resume:
${resumeText}

Interview Topic Plan:
${topicPlanText}

Topics Already Covered:
${coveredTopicsText}

Previous Interview History:
${historyText || "No previous questions. This is the first question."}

Your task is to generate ONE new technical interview question.

Before generating the question, analyze:

1. The candidate's resume.
2. The selected job role.
3. The interview topic plan.
4. Topics that have already been covered.
5. Previous questions and answers.
6. Previous evaluation scores and weaknesses.

QUESTION SELECTION RULES:

1. Prefer a high-priority topic from the topic plan that has NOT
   already been adequately covered.

2. 2. Do not repeat a technical concept unless the most recent answer
   on that concept was weak and a focused follow-up is needed.

3. If the most recent answer has a significant weakness, missing
    concept, or incomplete explanation, prioritize ONE focused
    follow-up question that directly investigates that weakness.

4. If the most recent answer has an overall score of 7/10 or higher,
   strongly prefer moving to a different technical topic.

5. If the most recent answer is below 7/10, prioritize a focused
    follow-up on the same technical topic, unless the topic is no
    longer relevant to the selected role or resume.

6. Do not repeat a previous question or ask a semantically equivalent
   question.

7. Do not focus the entire interview on the candidate's projects.

8. Use projects for contextual questions, but also cover relevant:
   - programming languages
   - frameworks
   - databases
   - core CS concepts
   - data structures and algorithms
   - security
   - testing
   - system design
   - networking
   - deployment
   - performance
   when supported by the resume, role, or topic plan.

9. Do not invent technologies that are unrelated to the resume,
   selected role, or topic plan.

10. Match the question to the selected difficulty.

11. If the candidate demonstrates strong knowledge, gradually increase
    depth or difficulty.

12. The interview should progressively cover different relevant
    technical areas.

13. A topic should be considered adequately covered only when the
    candidate has demonstrated sufficient understanding of that
    topic.

    A topic with an overall score below 7/10 must NOT be considered
    adequately covered.

    A weak topic should remain eligible for a focused follow-up.

14. Prefer breadth across the topic plan unless a weak answer requires
    a focused follow-up.

15. When asking a follow-up question, use the Feedback and Improvement
    from the previous evaluation to identify the specific missing
    concept.

    The follow-up should test that missing concept rather than simply
    asking another broad question about the same topic.

QUESTION SELECTION PRIORITY:

Priority 1:
If the most recent answer has an overall score below 7/10,
PRIORITIZE a focused follow-up on the most recent topic that
directly tests the weakness identified in the evaluation.

Do not move to an unrelated topic unless:
- the weakness cannot be meaningfully tested with another question, or
- the topic has already received an adequate follow-up.

Priority 2:
If the most recent answer is 7/10 or higher, prefer a new
high-priority topic that has not been adequately covered.

Priority 3:
If the most recent topic is weak but a follow-up would be
redundant or would not meaningfully test the weakness, select
another relevant uncovered topic.

Priority 4:
Never choose a previously adequately covered topic merely
because it has high priority.

A topic with a score below 7/10 must NOT be considered
adequately covered.

FOLLOW-UP LIMIT:

Do not ask more than TWO consecutive questions that test the same
specific technical concept.

If the candidate remains weak after two attempts on the same concept,
change the question to a different sub-concept
or move to another relevant topic.

A follow-up should deepen understanding, not simply rephrase the
previous question.

CONCEPT DIVERSITY:

Do not treat an entire topic as a single concept. Identify the
specific sub-concept being tested and avoid repeatedly testing the
same sub-concept.

For example, within JavaScript, distinguish between:
- event loop
- promises
- async/await
- closures
- scope
- prototypes
- modules
- error handling

If one sub-concept has already been tested repeatedly, prefer another
relevant sub-concept rather than generating another question about the
same concept.

OUTPUT FORMAT:

Return ONLY valid JSON in this exact structure:

{
  "question": "One technical interview question",
  "topic": "The topic being tested"
}
        `,

        text: {
            format: {
                type: "json_schema",
                name: "adaptive_interview_question",
                strict: true,
                schema: {
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
                    ],
                    additionalProperties: false
                }
            }
        }
    });

    return JSON.parse(response.output_text);
}

async function generateTopicPlan(
    resumeText,
    role,
    difficulty
) {
    const response = await client.responses.create({
        model: "gpt-5.6-luna",

        input: `
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

Return the result using the required JSON structure.
        `,

        text: {
            format: {
                type: "json_schema",
                name: "interview_topic_plan",
                strict: true,
                schema: {
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
                                ],
                                additionalProperties: false
                            }
                        }
                    },
                    required: [
                        "topics"
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
    evaluateAnswer,
    generateAdaptiveQuestion,
    generateTopicPlan
};
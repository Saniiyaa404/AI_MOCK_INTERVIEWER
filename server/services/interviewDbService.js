const pool = require("../db");

async function createInterview(role, difficulty, resumeId) {
    const query = `
        INSERT INTO interviews (
            role,
            baseline_difficulty,
            resume_id,
            status
        )
        VALUES ($1, $2, $3, 'in_progress')
        RETURNING
            id,
            role,
            baseline_difficulty,
            resume_id,
            status,
            started_at;
    `;

    const values = [role, difficulty, resumeId];

    const result = await pool.query(query, values);

    return result.rows[0];
}

async function createQuestion(
    interviewId,
    questionNumber,
    topic,
    difficulty,
    isFollowUp,
    questionText
) {
    const query = `
        INSERT INTO questions (
            interview_id,
            question_number,
            topic,
            difficulty,
            is_follow_up,
            question_text
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, interview_id, question_number, topic,
                  difficulty, is_follow_up, question_text, created_at;
    `;

    const values = [
        interviewId,
        questionNumber,
        topic,
        difficulty,
        isFollowUp,
        questionText
    ];

    // Start timing the database query
    const dbStartTime = performance.now();

    const result = await pool.query(query, values);

    // End timing the database query
    const dbEndTime = performance.now();

    console.log(
        `⏱️ PostgreSQL createQuestion query took ${(
            dbEndTime - dbStartTime
        ).toFixed(0)} ms`
    );

    return result.rows[0];
}

async function createAnswer(
    questionId,
    answerText,
    technicalAccuracy,
    completeness,
    communicationClarity,
    overallScore,
    feedback,
    improvement
) {
    const query = `
        INSERT INTO answers (
            question_id,
            answer_text,
            technical_accuracy,
            completeness,
            communication_clarity,
            overall_score,
            feedback,
            improvement
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
            id,
            question_id,
            answer_text,
            technical_accuracy,
            completeness,
            communication_clarity,
            overall_score,
            feedback,
            improvement,
            submitted_at;
    `;

    const values = [
        questionId,
        answerText,
        technicalAccuracy,
        completeness,
        communicationClarity,
        overallScore,
        feedback,
        improvement
    ];

    // Start timing the database query
    const dbStartTime = performance.now();

    const result = await pool.query(query, values);

    // End timing the database query
    const dbEndTime = performance.now();

    console.log(
        `⏱️ PostgreSQL createAnswer query took ${(
            dbEndTime - dbStartTime
        ).toFixed(0)} ms`
    );

    return result.rows[0];
}

async function completeInterview(interviewId) {
    const query = `
        UPDATE interviews
        SET
            status = 'completed',
            completed_at = NOW()
        WHERE id = $1
        RETURNING
            id,
            role,
            baseline_difficulty,
            status,
            started_at,
            completed_at;
    `;

    const values = [interviewId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        throw new Error("Interview not found.");
    }

    return result.rows[0];
}

async function createResume(fileName, resumeText) {
    const query = `
        INSERT INTO resumes (
            file_name,
            resume_text
        )
        VALUES ($1, $2)
        RETURNING id, file_name, created_at;
    `;

    const values = [fileName, resumeText];

    const result = await pool.query(query, values);

    return result.rows[0];
}

module.exports = {
    createInterview,
    createQuestion,
    createAnswer,
    completeInterview,
    createResume
};
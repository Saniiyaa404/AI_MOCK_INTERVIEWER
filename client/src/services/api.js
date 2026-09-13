export async function uploadResume(file) {
  const formData = new FormData();

  formData.append("resume", file);

  const response = await fetch(
    "http://localhost:5000/api/resume/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload resume");
  }

  return response.json();
}


export async function startInterview(role, difficulty) {
  const response = await fetch(
    "http://localhost:5000/api/interview/start",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role,
        difficulty,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to start interview");
  }

  return response.json();
}

export async function generateQuestion(
    resumeText,
    role,
    difficulty,
    topicPlan
) {
    const response = await fetch(
        "http://localhost:5000/api/interview/generate-question",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resumeText,
                role,
                difficulty,
                topicPlan
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to generate question");
    }

    return response.json();
}

export async function evaluateAnswer(
    question,
    answer,
    role,
    difficulty
) {
    const response = await fetch(
        "http://localhost:5000/api/interview/evaluate-answer",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                question,
                answer,
                role,
                difficulty,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to evaluate answer");
    }

    return response.json();
}

export async function generateAdaptiveQuestion(
    resumeText,
    role,
    difficulty,
    interviewHistory,
    topicPlan,
    coveredTopics
) {
    const response = await fetch(
        "http://localhost:5000/api/interview/generate-adaptive-question",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resumeText,
                role,
                difficulty,
                interviewHistory,
                topicPlan,
                coveredTopics
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to generate adaptive question");
    }

    return response.json();
}

export async function generateTopicPlan(
    resumeText,
    role,
    difficulty
) {
    const response = await fetch(
        "http://localhost:5000/api/interview/generate-topic-plan",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resumeText,
                role,
                difficulty,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to generate topic plan");
    }

    return response.json();
}
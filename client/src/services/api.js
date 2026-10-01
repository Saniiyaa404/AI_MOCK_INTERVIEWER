const API_URL = import.meta.env.VITE_API_URL;

export async function uploadResume(file) {
  const formData = new FormData();

  formData.append("resume", file);

  const response = await fetch(
    `${API_URL}/api/resume/upload`,
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
    `${API_URL}/api/interview/start`,
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
        `${API_URL}/api/interview/generate-question`,
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
        `${API_URL}/api/interview/evaluate-answer`,
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
    role,
    difficulty,
    selectedTopic,
    latestItem
) {
    const response = await fetch(
        `${API_URL}/api/interview/generate-adaptive-question`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                role,
                difficulty,
                selectedTopic,
                latestItem
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
        `${API_URL}/api/interview/generate-topic-plan`,
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

export async function startInterviewInDatabase(
    role,
    difficulty,
    resumeId
) {
    const response = await fetch(
        `${API_URL}/api/interview/start`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                role,
                difficulty,
                resumeId,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to create interview");
    }

    return response.json();
}

export async function saveQuestionToDatabase(
    interviewId,
    questionNumber,
    topic,
    difficulty,
    isFollowUp,
    questionText
) {
    const response = await fetch(
        `${API_URL}/api/interview/${interviewId}/questions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                questionNumber,
                topic,
                difficulty,
                isFollowUp,
                questionText,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to save question");
    }

    return response.json();
}

export async function saveAnswerToDatabase(
    interviewId,
    questionId,
    answerText,
    technicalAccuracy,
    completeness,
    communicationClarity,
    overallScore,
    feedback,
    improvement
) {
    const response = await fetch(
        `${API_URL}/api/interview/${interviewId}/answers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                questionId,
                answerText,
                technicalAccuracy,
                completeness,
                communicationClarity,
                overallScore,
                feedback,
                improvement,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to save answer");
    }

    return response.json();
}

export async function completeInterviewInDatabase(interviewId) {
    const response = await fetch(
        `${API_URL}/api/interview/${interviewId}/complete`,
        {
            method: "PATCH",
        }
    );

    if (!response.ok) {
        throw new Error("Failed to complete interview");
    }

    return response.json();
}

export async function getInterviewHistory() {
    const response = await fetch(
        `${API_URL}/api/interview/history`
    );

    if (!response.ok) {
        throw new Error("Failed to load interview history");
    }

    return response.json();
}

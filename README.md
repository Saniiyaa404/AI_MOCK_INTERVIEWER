# AI-Powered Technical Mock Interviewer

> An AI-driven technical interview platform that generates adaptive, role-specific interview questions, evaluates candidate responses, and provides detailed performance insights — powered by Gemini, React, Node.js, Express, and PostgreSQL.

<p align="center">
  <a href="https://ai-mock-interviewer-three-gray.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20Website-success?style=for-the-badge" alt="Live Demo">
  </a>
  <a href="https://github.com/Saniiyaa404/AI_MOCK_INTERVIEWER">
    <img src="https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github" alt="GitHub Repository">
  </a>
</p>

---

## 📌 Overview

**AI-Powered Technical Mock Interviewer** is a full-stack web application designed to simulate technical interviews using generative AI.

Instead of following a fixed list of interview questions, the platform analyzes the candidate's resume, selected role, and interview performance to dynamically determine what should be asked next.

The system can:

- Analyze an uploaded resume
- Generate role-specific technical questions
- Create a structured interview topic plan
- Adapt subsequent questions based on previous answers
- Identify weak areas and generate focused follow-up questions
- Evaluate answers across multiple dimensions
- Store interview progress and results securely
- Provide a detailed performance dashboard
- Maintain interview history for the current anonymous user

The application is deployed using **Vercel + Render**, with **Supabase PostgreSQL** and **Supabase Anonymous Authentication** for persistence and privacy.

---

## ✨ Key Features

### 📄 Resume-Based Interview Preparation

Candidates can upload their resume as a PDF.

The backend:

1. Receives the PDF
2. Extracts its text
3. Stores the extracted resume data
4. Uses the resume context during interview generation

This allows the interview to be tailored to the candidate's actual skills and projects.

---

### 🎯 Role & Difficulty Selection

Before starting an interview, the candidate selects:

- Target role
- Baseline difficulty

Supported difficulty levels:

- Easy
- Medium
- Hard

The selected difficulty is preserved throughout the interview and influences question generation.

---

### 🧠 Dynamic Topic Planning

Instead of generating completely random questions, the system creates a structured topic plan based on the selected role and candidate profile.

Example topics may include:

- Node.js Backend Development
- Express.js API Development
- Authentication & Authorization
- MongoDB Data Modeling
- REST APIs
- JavaScript
- Backend Architecture

The system tracks which topics have already been adequately covered.

---

### 🔄 Adaptive Interview Engine

The interviewer dynamically adapts based on the candidate's previous answers.

If an answer is weak, the system can prioritize that area for a follow-up question.

The adaptive logic considers:

- Previous question
- Candidate answer
- Technical evaluation
- Weak areas
- Previously covered topics
- Current interview history
- Selected difficulty

A topic is not considered adequately covered simply because it was asked once.

The system uses the candidate's evaluation score to determine whether additional coverage is required.

---

### 🧩 Focused Follow-Up Questions

Weak answers can trigger targeted follow-up questions.

The system uses previous feedback and improvement suggestions to decide what should be explored next.

To avoid repetitive questioning, the interviewer also limits consecutive questions around the same specific concept.

---

### 📊 AI-Powered Answer Evaluation

Every submitted answer is evaluated using three major dimensions:

| Metric | Description |
|---|---|
| Technical Accuracy | Correctness of the technical explanation |
| Completeness | Coverage and depth of the answer |
| Communication Clarity | How clearly the candidate communicates the concept |
| Overall Score | Combined assessment of the response |

The system also provides:

- Feedback
- Improvement suggestions
- Overall score

---

### 📈 Performance Dashboard

After completing an interview, candidates receive a detailed results dashboard containing:

- Overall score
- Technical Accuracy
- Completeness
- Communication Clarity
- Performance breakdown
- Question-wise review
- Individual answer evaluations
- Areas of improvement
- Number of answered questions

The dashboard helps candidates identify their technical strengths and areas requiring further preparation.

---

### 📝 Interview History

Completed and ongoing interviews are stored in PostgreSQL.

Candidates can view their previous interview attempts, including:

- Role
- Difficulty
- Interview status
- Number of questions
- Number of answered questions
- Overall score
- Start time
- Completion time

Only interviews belonging to the current anonymous user are returned.

---

### 🔐 Anonymous Authentication & Data Isolation

The application uses **Supabase Anonymous Authentication**.

Users do not need to create an account or provide personal information to start using the platform.

Each anonymous user receives a unique Supabase user ID.

User-owned data is associated with this ID, including:

- Resumes
- Interviews
- Interview questions
- Answers
- Results

The backend verifies the Supabase authentication token before allowing access to protected interview data.

This prevents one anonymous user's interview history from being exposed to another user.

---

### ⏭️ Early Interview Submission

Users do not have to complete all 10 questions if they want to finish early.

The application allows an interview to be submitted before the final question, provided the current question has been answered and evaluated.

The results dashboard then reflects the actual number of answered questions.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      React + Vite   │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌─────────────────────┐
                    │   Node.js + Express │
                    │      Backend        │
                    └──────┬─────────┬────┘
                           │         │
                ┌──────────┘         └─────────────┐
                ▼                                  ▼
       ┌─────────────────┐                ┌─────────────────┐
       │ Gemini AI       │                │ Supabase Auth   │
       │ Question &      │                │ Anonymous Auth  │
       │ Evaluation      │                └─────────────────┘
       └─────────────────┘
                │
                ▼
       ┌─────────────────┐
       │ PostgreSQL      │
       │ via Supabase    │
       └─────────────────┘
```
🔄 Interview Flow

```
Resume Upload
      ↓
PDF Text Extraction
      ↓
Select Role & Difficulty
      ↓
Create Interview
      ↓
Generate Topic Plan
      ↓
Generate First Question
      ↓
Candidate Answers
      ↓
AI Evaluation
      ↓
Update Interview History
      ↓
Analyze Weak Areas
      ↓
Generate Adaptive Question
      ↓
Repeat
      ↓
Complete Interview
      ↓
Performance Dashboard
```
🛠️ Tech Stack
1. Frontend
- React
- Vite
- JavaScript
- CSS
- Fetch API
- Supabase JavaScript Client
2. Backend
- Node.js
- Express.js
- REST APIs
- Multer
- PDF parsing
- Supabase JavaScript Client
3. AI
- Google Gemini
- Dynamic question generation
- Topic planning
- Adaptive question generation
- Answer evaluation
4. Database
- PostgreSQL
- Supabase
- Relational data model
- UUID-based records
5. Authentication
- Supabase Anonymous Authentication
- JWT-based backend authentication
- User ownership validation
6. Deployment
- Vercel — Frontend
- Render — Backend
- Supabase — Database & Authentication

Database Design

The application uses PostgreSQL with the following core tables:

1. resumes

Stores uploaded resume information.

```
resumes
├── id
├── file_name
├── resume_text
├── user_id
└── created_at
```

2. interviews

Stores interview-level information.

```
interviews
├── id
├── resume_id
├── user_id
├── role
├── baseline_difficulty
├── status
├── started_at
└── completed_at
```

3. questions

Stores generated interview questions.

```
questions
├── id
├── interview_id
├── question_number
├── topic
├── difficulty
├── is_follow_up
├── question_text
└── created_at
```

4. answers

Stores candidate answers and AI evaluation.

```
answers
├── id
├── question_id
├── answer_text
├── technical_accuracy
├── completeness
├── communication_clarity
├── overall_score
├── feedback
├── improvement
└── submitted_at
```

5. Relationships
```
User
 │
 ├── Resumes
 │      │
 │      └── Interviews
 │             │
 │             ├── Questions
 │             │      │
 │             │      └── Answers
 │             │
 │             └── Results
 │
 └── Interview History




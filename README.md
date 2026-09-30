# AI Mock Interviewer

An AI-powered technical mock interview platform that generates personalized interview questions based on a candidate's resume, selected job role, and difficulty level.

The system dynamically adapts question topics and difficulty based on the candidate's previous performance and provides structured AI-generated feedback after every answer.

---

## Overview

AI Mock Interviewer simulates a technical interview experience where candidates can:

- Upload their resume
- Select a target job role
- Select a baseline interview difficulty
- Receive AI-generated technical questions
- Get adaptive questions based on previous performance
- Receive structured feedback and scoring
- Track their interview performance
- View a detailed results dashboard

The platform combines AI-based question generation with deterministic interview logic and PostgreSQL persistence.

---

## Key Features

### Resume-Based Interview Setup

Candidates can upload their resume in PDF format.

The system:

1. Extracts the resume text
2. Stores the resume in PostgreSQL
3. Uses the extracted content as context for interview generation

---

### AI-Powered Topic Planning

Before the interview begins, the AI generates a topic plan based on:

- Candidate resume
- Selected job role
- Selected difficulty

Topics are assigned priorities so that the interview can cover multiple relevant technical areas.

---

### Adaptive Question Generation

The interview dynamically adapts based on the candidate's performance.

The system considers:

- Previous answer score
- Current topic
- Topic coverage
- Baseline difficulty
- Previous follow-up questions

Weak answers can trigger focused follow-up questions, while strong answers can lead to more challenging questions.

---

### Adaptive Difficulty

The interview starts with the selected baseline difficulty:

- Easy
- Medium
- Hard

Difficulty can temporarily increase or decrease based on the candidate's performance.

The system prevents difficulty changes from accumulating indefinitely and returns to the baseline when appropriate.

---

### AI Answer Evaluation

Each answer is evaluated across three dimensions:

- Technical Accuracy
- Completeness
- Communication Clarity

The question-level score is calculated from these three evaluation dimensions.

The interview-level score is calculated from the performance across all answered questions.

---

### Persistent Interview Data

Interview data is stored in PostgreSQL using Supabase.

The database stores:

- Resumes
- Interviews
- Questions
- Answers
- Evaluation scores
- Feedback
- Improvement suggestions

---

### Results Dashboard

After completing the interview, candidates receive a detailed performance dashboard containing:

- Overall interview score
- Technical accuracy
- Completeness
- Communication clarity
- Per-question performance chart
- Question-wise feedback
- Improvement suggestions
- Areas of improvement

The question-wise review is collapsible to keep the dashboard clean and easy to navigate.

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js

### AI

- Google Gemini API

### Database

- PostgreSQL
- Supabase

### Resume Processing

- PDF parsing
- Multer

### Development Tools

- VS Code
- Git
- GitHub

---

## System Architecture

```text
                ┌─────────────────────┐
                │   React Frontend    │
                │      (Vite)         │
                └──────────┬──────────┘
                           │
                           │ HTTP API
                           ▼
                ┌─────────────────────┐
                │  Node.js + Express  │
                │      Backend        │
                └───────┬─────┬───────┘
                        │     │
             ┌──────────┘     └──────────────┐
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │  Gemini API     │             │   PostgreSQL    │
    │                 │             │    Supabase     │
    │ Question Gen.   │             │                 │
    │ Evaluation      │             │ Resumes         │
    │ Topic Planning  │             │ Interviews      │
    └─────────────────┘             │ Questions       │
                                    │ Answers         │
                                    └─────────────────┘
```
Interview Flow

```text

Resume Upload
      │
      ▼
Resume Text Extraction
      │
      ▼
Interview Setup
(Role + Difficulty)
      │
      ▼
AI Topic Planning
      │
      ▼
Question Generation
      │
      ▼
Candidate Answer
      │
      ▼
AI Evaluation
      │
      ▼
Adaptive Topic + Difficulty Selection
      │
      ▼
Next Question
      │
      ▼
10 Question Interview
      │
      ▼
Results Dashboard
```
Database Structure

The application uses four main tables:

1. resumes - Stores uploaded resume information and extracted resume text.

2. interviews - Stores interview configuration and status.

3. questions - Stores generated interview questions, topics, difficulty and question type.

4. answers - Stores candidate answers and their evaluation scores.

Relationship:
```text

Resume
   │
   ▼
Interview
   │
   ├── Question
   │      │
   │      └── Answer
   │
   ├── Question
   │      │
   │      └── Answer
   │
   └── ...
Scoring System
```

Each answer receives three scores from 0–10:

Technical Accuracy
Completeness
Communication Clarity

The question-level overall score is calculated as:

Overall Score = (Technical Accuracy + Completeness  + Communication Clarity) / 3

The final interview score is calculated from the average overall score of the answered questions.

Adaptive Difficulty Logic: The selected difficulty acts as the interview's baseline.

The system temporarily adjusts difficulty according to performance:

```text
Low Score
   ↓
Lower Difficulty

Moderate Score
   ↓
Baseline Difficulty

High Score
   ↓
Higher Difficulty
```

Adaptive difficulty is bounded between:

Easy ← Medium → Hard

so the system does not continuously increase or decrease difficulty.

Project Structure

```text

AI_MOCK_INTERVIEWER/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResumeUploader.jsx
│   │   │   ├── InterviewSetup.jsx
│   │   │   └── ResultsDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/
│   ├── routes/
│   │   ├── interviewRoutes.js
│   │   └── resumeRoutes.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   └── interviewDbService.js
│   │
│   ├── db.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

Getting Started
1. Clone the repository
```text
git clone https://github.com/Saniiyaa404/AI_MOCK_INTERVIEWER
cd AI_MOCK_INTERVIEWER
```
3. Install frontend dependencies
```
cd client
npm install
```
5. Install backend dependencies
```
cd ../server
npm install
```
7. Configure environment variables
```
Create a .env file inside the server directory.

GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_supabase_postgresql_connection_string

Do not commit the .env file to GitHub.
```
5. Start the backend
```
From the server directory:

npm run dev
```
6. Start the frontend
```
Open another terminal:

cd client
npm run dev
```
The frontend will be available at the local Vite development URL.

Current Scope

This project currently focuses on the core technical mock interview experience:

+ Resume processing

+ AI topic planning

+ Adaptive question generation

+ Adaptive difficulty
  
+ AI answer evaluation
  
+ PostgreSQL persistence
  
+ Interview results dashboard

Additional features such as voice-based interviews, live coding and authentication can be added in future iterations.

Future Improvements

Potential future enhancements include:

+ Voice-based interview interaction
  
+ Speech-to-text answer processing
  
+ Live coding environment
  
+ Authentication and user profiles
  
+ Interview history
  
+ Performance tracking across multiple interviews
  
+ More advanced analytics
  
+ Production deployment


Author-
Saniya

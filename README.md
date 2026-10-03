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

### 🎙️ Voice-Based Interview Responses

Candidates can answer technical interview questions by speaking directly through their microphone, in addition to typing their responses.

The application uses the **Web Speech API** to provide browser-based speech recognition and convert spoken responses into text.

Key capabilities include:

* **Speech-to-Text Conversion:** Converts spoken answers into text in real time.
* **Hands-Free Answering:** Allows candidates to respond verbally instead of typing every answer.
* **Text-Based Evaluation:** Converts recognized speech into text that can be submitted to the existing AI-powered evaluation engine.
* **Integrated Interview Workflow:** Voice responses follow the same answer submission and evaluation process as typed responses.

This feature provides a more natural mock interview experience while reusing the existing adaptive questioning and answer evaluation pipeline.

**Technology:** Web Speech API (Speech Recognition).


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
## 🎙️ Voice Input Flow

```text
React + Vite Frontend
        |
        ├── Typed Answer Input
        |
        └── Web Speech API
                 |
          Speech-to-Text
                 |
          Recognized Text
                 |
                 ▼
       Node.js + Express Backend
                 |
                 ▼
             Gemini AI
        Answer Evaluation
```

## 🔄 Interview Flow

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
## 🛠️ Tech Stack
1. Frontend
   
- React
- Vite
- JavaScript
- CSS
- Fetch API
- Supabase JavaScript Client
- Web Speech API — Speech-to-Text for Voice-Based Interview Responses
  
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

## Database Design

The application uses PostgreSQL with the following core tables:

1. Resumes

Stores uploaded resume information.

```
resumes
├── id
├── file_name
├── resume_text
├── user_id
└── created_at
```

2. Interviews

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

3. Questions

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
```
## 🔐 Security & Privacy

The application implements authentication and ownership checks at the backend level.

Protected API Routes

Protected operations include:

- Resume upload
- Interview creation
- Question persistence
- Answer persistence
- Interview completion
- Interview history
- Interview results

Each request requires a valid Supabase access token.

The backend extracts the authenticated user's ID and verifies ownership before accessing interview-related records.

#Important Security Practices
- API keys are stored using environment variables
- Secrets are not committed to Git
- Supabase Service Role Key is not used by the frontend
- Backend validates authenticated users
- Interview queries are filtered by user_id
- Anonymous users cannot access another user's interview history

## 📁 Project Structure

```
AI_MOCK_INTERVIEWER/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResultsDashboard.jsx
│   │   │   └── ...
│   │   │
│   │   ├── context/
│   │   │   └── InterviewProvider.jsx
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   └── ...
│   │
│   └── package.json
│
├── server/
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── routes/
│   │   ├── interviewRoutes.js
│   │   └── resumeRoutes.js
│   │
│   ├── services/
│   │   └── interviewDbService.js
│   │
│   ├── db.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```
## 🚀 Local Development

1. Clone the repository
```
git clone https://github.com/Saniiyaa404/AI_MOCK_INTERVIEWER.git
cd AI_MOCK_INTERVIEWER
```
2. Install frontend dependencies
```
cd client
npm install
```
3. Install backend dependencies
```
cd ../server
npm install
```
4. Configure environment variables
Create:
```
client/.env
```
Example:
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```
Create:
```
server/.env
```
Example:
```
DATABASE_URL=your_postgresql_connection_string

GEMINI_API_KEY=your_gemini_api_key

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```
Never commit .env files or secret API keys to GitHub.

5. Start the backend

From the server directory:

```
npm start
```
The backend runs on:

```
http://localhost:5000
```
6. Start the frontend

From the client directory:

```
npm run dev
```
The frontend will be available at the Vite development URL shown in the terminal.

# 🌐 Live Demo
Frontend

- Live Application:

https://ai-mock-interviewer-three-gray.vercel.app

- Backend

Render API:

https://ai-mock-interviewer-toyt.onrender.com

- Repository

https://github.com/Saniiyaa404/AI_MOCK_INTERVIEWER

## 📸 Screenshots

1. Landing / Interview Setup
   
<img width="1894" height="918" alt="image" src="https://github.com/user-attachments/assets/f76a7093-2132-43db-9162-beab31fd84db" />


3. Resume Upload
   
<img width="1910" height="915" alt="image" src="https://github.com/user-attachments/assets/31cf1ac6-ba42-4783-850b-692d4abef697" />


5. Interview Interface
   
<img width="1890" height="910" alt="image" src="https://github.com/user-attachments/assets/370abc27-4bda-4f84-9267-f35c84b23725" />


7. AI Evaluation
   
<img width="1895" height="917" alt="image" src="https://github.com/user-attachments/assets/cb665595-3541-413b-96c6-cb1fe40008cc" />


9. Results Dashboard
    
<img width="1895" height="891" alt="image" src="https://github.com/user-attachments/assets/b0049f20-9e74-4711-bd60-b6e1c3f2fd92" />

<img width="1895" height="913" alt="image" src="https://github.com/user-attachments/assets/bc5febc1-5424-44d8-9469-48bca0ba334e" />

<img width="1894" height="911" alt="image" src="https://github.com/user-attachments/assets/04ad0286-81d8-466a-9512-f971589a34b0" />


11. Interview History
    
<img width="1905" height="837" alt="image" src="https://github.com/user-attachments/assets/044ceb3d-5966-4f61-a28b-5bdeed91e8bc" />


# 🧠 Adaptive Interview Logic

One of the core features of the application is adaptive question selection.

The system tracks:
```
Interview History
       ↓
Answer Evaluation
       ↓
Identify Weak Areas
       ↓
Check Covered Topics
       ↓
Prioritize Topics
       ↓
Generate Next Question
```
# Topic Coverage

A topic is not marked as adequately covered simply because a question from that topic was asked.

The system considers the candidate's performance before treating the topic as sufficiently covered.

For example:
```
Question → Authentication
Score → 5.5 / 10
       ↓
Topic remains weak
       ↓
Generate focused follow-up
```
Whereas:
```
Question → Authentication
Score → 8.5 / 10
       ↓
Topic can be considered adequately covered
       ↓
Move toward other topics
```
This helps make the interview more responsive to candidate performance.

# 📊 Evaluation Model

Each answer receives a structured evaluation:

```
                    Candidate Answer
                           │
                           ▼
                  ┌─────────────────┐
                  │   Gemini AI      │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
 Technical Accuracy   Completeness   Communication Clarity
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    Overall Score
                           │
                           ▼
                 Feedback + Improvement
```

This structured output is then stored in PostgreSQL and displayed on the results dashboard.

# 🧪 Current Implementation Status

```
| Feature                       | Status      |
| ----------------------------- | ----------- |
| React Frontend                | ✅ Completed |
| Node.js / Express Backend     | ✅ Completed |
| Resume PDF Upload             | ✅ Completed |
| PDF Text Extraction           | ✅ Completed |
| Role Selection                | ✅ Completed |
| Difficulty Selection          | ✅ Completed |
| AI Topic Planning             | ✅ Completed |
| Dynamic Question Generation   | ✅ Completed |
| Adaptive Question Generation  | ✅ Completed |
| Weak Topic Detection          | ✅ Completed |
| Follow-up Questions           | ✅ Completed |
| AI Answer Evaluation          | ✅ Completed |
| Structured Scoring            | ✅ Completed |
| Interview Persistence         | ✅ Completed |
| PostgreSQL Database           | ✅ Completed |
| Anonymous Authentication      | ✅ Completed |
| User Data Isolation           | ✅ Completed |
| Interview History             | ✅ Completed |
| Results Dashboard             | ✅ Completed |
| Early Interview Submission    | ✅ Completed |
| Vercel Deployment             | ✅ Completed |
| Render Deployment             | ✅ Completed |
| Production End-to-End Testing | ✅ Completed |
| Voice-Based Answer Input      | ✅ Completed |
| Web Speech API Integration    | ✅ Completed |
| Speech-to-Text Conversion     | ✅ Completed |
```

## 🔮 Future Enhancements

The following features can be added in future iterations:

 💻 Live Coding Environment

Add an in-browser coding editor with:

- Syntax highlighting
- Code execution
- Test cases
- Programming-language selection
- AI-based code evaluation
- 📈 Long-Term Performance Analytics

 Track performance across multiple interviews and visualize:

- Topic-wise progress
- Score trends
- Frequently weak concepts
- Improvement over time
- 🧹 Anonymous User Lifecycle Management

 Introduce periodic cleanup of inactive anonymous accounts and their associated data.

 👤 Optional Persistent Accounts

- Allow users to upgrade from anonymous sessions to persistent accounts while retaining their interview history.

# 🎯 Project Goals

The project aims to solve several limitations of traditional mock interviews:

- Static question sets
- Lack of personalized questioning
- Limited feedback
- No adaptive follow-ups
- Poor visibility into weak areas
- Difficulty tracking interview performance

By combining generative AI with structured interview state management and persistent user data, the platform provides a more personalized technical interview practice experience.

# 🧩 Engineering Highlights

This project demonstrates practical implementation of:

- Full-stack application architecture
- REST API design
- React state management
- Express middleware
- JWT-based authentication
- Anonymous authentication
- PostgreSQL relational modeling
- Database ownership checks
- File upload handling
- PDF text extraction
- AI prompt engineering
- Structured AI responses
- Adaptive decision logic
- Asynchronous API workflows
- Deployment and environment configuration
- Production debugging
- Secure environment variable management

## 👩‍💻 Author
Saniya

B.Tech Electronics and Communication Engineering

Madan Mohan Malaviya University of Technology, Gorakhpur

Interests: Software Engineering · Backend Development · AI Applications · Full-Stack Development


<p align="center"> Built with ❤️ using React, Node.js, Express, Gemini, PostgreSQL and Supabase. </p> ```






















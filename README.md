# 🎓 UniConnect Student Management System

<div align="center">

![UniConnect Logo](https://img.shields.io/badge/UniConnect-Student%20Management-blue?style=for-the-badge&logo=graduation-cap)

**A production-grade, full-stack student management platform augmented with a dedicated FastAPI AI microservice layer.**

[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-orange?style=for-the-badge)](https://ollama.com/)
[![Ngrok](https://img.shields.io/badge/Ngrok-Tunneling-blue?style=for-the-badge&logo=ngrok&logoColor=white)](https://ngrok.com/)

</div>

---

## 🌟 Overview

UniConnect is an enterprise-grade academic administration dashboard and learning system. It streamlines student lifecycle operations, department scheduling, and enrollment tracking. It also features a **Python FastAPI AI microservice layer** powered by local LLMs (via Ollama) to offer natural language database querying, document retrieval (RAG), automated quiz generation, and analytical dashboards.

---

## 🏗️ Architecture & Tech Stack

UniConnect is built on a decoupled, multi-service architecture:

```
                  ┌────────────────────────┐
                  │   React 18 Frontend    │
                  │   (Vite + Ant Design)  │
                  └───────────┬────────────┘
                              │ HTTP / JSON
                              ▼
                  ┌────────────────────────┐
                  │  Node.js Express App   │  (Manages standard CRUD,
                  │     (Core API Hub)     │   Auth, and proxies AI requests)
                  └─────┬───────────┬──────┘
                        │           │
           Postgres DDL │           │ Proxy HTTP (with Ngrok tunnel in Prod)
                        ▼           ▼
          ┌───────────────┐   ┌────────────────────────┐
          │  PostgreSQL   │   │  Python FastAPI App    │ (Handles Ollama queries,
          │   Database    │◄──┤   (AI Microservice)    │  FAISS Vector store, and
          └───────────────┘   └────────────────────────┘  NL-to-SQL logic)
```

### 💻 Technology Details
* **Frontend**: React 18 (bootstrapped with Vite), Ant Design (UI Components), Axios for API interactions, and custom CSS variables for premium layouts.
* **Express Backend**: Node.js & Express, JWT-based Authentication, `pg` database driver, and security middleware (Helmet & Rate Limiting).
* **AI Service**: Python & FastAPI, FAISS CPU vector storage (for RAG), Ollama client integration, and PyPDF2 document extractors.
* **Database**: PostgreSQL featuring an 8-table relational schema with relational integrity and foreign-key constraints.

---

## ✨ Features

### 1. Core Academic Management
* 👥 **Student Administration**: Full student lifecycle directory tracking admissions, bios, and department links.
* 📚 **Course Scheduling**: Manage curriculums, credits, semester divisions, and departmental assignments.
* 🏢 **Department Organization**: Hierarchy control linking students, faculty members, and course tracks.
* 👨‍🏫 **Faculty Directory**: Instructor assignments, hire dates, and department associations.
* 🏫 **Classroom Allocations**: Track classroom buildings, room codes, and physical seating capacities.
* 📝 **Enrollments**: Map students to course registries, track dates, and input final grades.
* ✅ **Subject-wise Attendance**: Real-time roll calls with Status filters (`Present`, `Absent`, `Late`) and semester search logic.
* 🎓 **Alumni Tracking**: Record graduation timelines, current employers, and professional profiles.

### 2. AI-Augmented Microservice
* 💬 **AI Database Assistant (NL-to-SQL)**: Query the PostgreSQL database in plain English. Translates questions like *"List students with attendance below 75%"* into secure SQL SELECT commands, executes them, and returns raw tables.
* 📚 **AI Learning Hub (RAG)**: Drag-and-drop course PDFs. The system extracts text, embeds it using sentence-transformers, stores it in a FAISS vector database, and runs referenced Q&A sessions.
* 📝 **AI Quiz Generator**: Enter any academic topic to generate interactive multiple-choice quizzes with options, difficulty levels, correct answers, and explanations.
* 💡 **Smart Insights Dashboard**: Summarizes database statistics (attendance, top courses) and provides automated suggestions for both students (personal progress) and admins (institutional analytics).

---

## 🔒 Security & Role-Based Access Control (RBAC)

UniConnect isolates admin capabilities from student views using a secure middleware layer:

* **Students**: Restricted to viewing their personal profiles, academic attendance metrics, and learning resources. Student requests to the NL-to-SQL helper are automatically validated by `validate_student_filter()` to enforce `student_id` filters on sensitive queries.
* **Administrators**: Full access to all CRUD panels, course management tables, and institutional statistics.
* **Admin Verification**: Registering an Admin account requires entering the system's `ADMIN_SECRET` code on the registration page to prevent privilege escalation.
  * *Default code*: `UNICONNECT2026` (configurable via `.env` on the backend).
* **Input Protections**: Express backend runs input checks for password complexity, Helmet configuration to prevent XSS/Clickjacking, and parameterized queries (`$1`, `$2`) to block standard SQL injection payloads.

---

## 🗄️ Relational Database Schema

The system uses PostgreSQL containing 8 normalized tables:

```
UniConnect Database Structure
 ├── departments (Organizational units, head of department)
 ├── students (Primary entity, foreign-keyed to departments)
 ├── instructors (Faculty directory, foreign-keyed to departments)
 ├── courses (Academic titles, credit counts, semesters)
 ├── classrooms (Physical building details and capacities)
 ├── enrollments (Maps student_id to course_id, stores grades)
 ├── attendance (Logs dates, course references, and status)
 └── alumni (Graduate job records and companies)
```

For the exact table configuration, review [schema.sql](file:///d:/College/FullStack_Project/backend/schema.sql).

---

## 🚀 Installation & Local Development

To run the full stack locally, follow these steps:

### 📋 Prerequisites
* **Node.js** (v16+) and **npm**
* **Python** (v3.9+) and **pip**
* **PostgreSQL** (v12+) running locally or on a cloud service
* **Ollama** installed with the model downloaded:
  ```bash
  ollama pull qwen2.5:3b
  ```

---

### ⚡ Setup Instructions

#### 1️⃣ Database Setup
Create a PostgreSQL database and initialize the tables using the schema file:
```bash
psql -U postgres -d your_database_name -f backend/schema.sql
```

#### 2️⃣ Express Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file in the `backend/` folder:
   ```env
   DATABASE_URL=postgresql://postgres_username:password@localhost:5432/your_database_name
   NODE_ENV=development
   PORT=5000
   ADMIN_SECRET=UNICONNECT2026
   AI_SERVICE_URL=http://localhost:8000
   ```
3. Start the backend:
   ```bash
   npm run dev
   # or
   npm start
   ```

#### 3️⃣ Python AI Microservice Setup
1. Navigate to the AI service directory and install requirements:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   ```
2. Create a `.env` file in the `ai-service/` folder:
   ```env
   DATABASE_URL=postgresql://postgres_username:password@localhost:5432/your_database_name
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=qwen2.5:3b
   OLLAMA_TIMEOUT=300
   ```
3. Boot the FastAPI server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

> [!TIP]
> **Windows Quickstart Script**
> On Windows, you can double-click **`start_ai_service.bat`** in the root directory. This batch script starts the local FastAPI server and establishes a stable Ngrok tunnel mapping to your backend.

#### 4️⃣ Frontend Setup
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file in the `frontend/` folder:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```

Open `http://localhost:5173` (or the port outputted by Vite) to view the application.

---

## 🔬 Evaluation & Testing Framework

UniConnect features an automated verification suite that runs locally to audit API and model performance. See [EVALUATION.md](file:///d:/College/FullStack_Project/EVALUATION.md) for full specs.

### 1. Express Backend Tests (API & Router Security)
Runs Express routing, middleware access policies, password strength checkers, and SQLi blocking rules:
```bash
cd backend
npm test
```
*Runs 49+ integration test cases.*

### 2. Python AI Unit Tests (Validation Logic)
Validates query parsers, student-isolation checks, and JSON loaders without needing to run an LLM instance:
```bash
cd ai-service
python -m pytest tests/test_unit.py -v
```
*Runs 38+ unit test cases.*

### 3. Quantitative AI Performance Evaluation (LLM Integration)
Validates Ollama against a golden dataset of 15 NL questions, reporting formal metrics (Execution Accuracy, Keyword Presence, RBAC Enforcement, Injection Prevention Rate) and outputting a letter grade report:
```bash
cd ai-service
python tests/evaluate_ai.py
```
*Runs 29+ integration evaluations.*

---

## 🔗 API Endpoints

### Core Backend (Express)
* **Auth**: `POST /api/auth/register`, `POST /api/auth/login`
* **Data CRUD**:
  * Students: `/api/students`
  * Courses: `/api/courses`
  * Departments: `/api/departments`
  * Instructors: `/api/instructors`
  * Enrollments: `/api/enrollments`
  * Attendance: `/api/attendance`
  * Alumni: `/api/alumni`
  * Classrooms: `/api/classrooms`

### AI Service (Proxied via Express `/api/ai/*`)
* **NL-to-SQL Query**: `POST /api/ai/query` (takes `{ "question": "..." }`)
* **RAG Upload**: `POST /api/ai/upload` (accepts PDF multipart file)
* **RAG Ask**: `POST /api/ai/ask` (takes `{ "question": "..." }`)
* **RAG Document Inventory**: `GET /api/ai/documents`, `DELETE /api/ai/documents/:name`
* **Quiz Generator**: `POST /api/ai/quiz` (takes `{ "topic": "...", "num_questions": 5, "difficulty": "medium" }`)
* **Smart Insights**: `POST /api/ai/insights` (summarizes academic trends)

---

## 👨‍💻 Maintainer

* **Sahil Awatramani** — *Full-Stack & AI Engineer* — [GitHub Profile](https://github.com/sahilawatramani)

---

## 📄 License

This project is licensed under the MIT License.

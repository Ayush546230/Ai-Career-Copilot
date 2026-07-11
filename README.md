# AI Career Copilot (PathForge AI)

> **GenAI powered Career Guidance & Mentorship Platform**

---

## Live Deployment

| Service | Platform | Link |
| :--- | :--- | :--- |
| **Frontend (PathForge AI)** | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) | [Visit Site](https://pathforgeai-zeta.vercel.app/) |
| **Backend Core API** | ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white) | [API Endpoint](https://ai-career-copilot-gxmv.onrender.com) |
| **AI Engine Microservice** | ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white) | [API Endpoint](https://ai-career-copilot-1-84c6.onrender.com) |

---

## Project Overview

**AI Career Copilot** (frontend known as **PathForge**) is a comprehensive, microservices-based career counseling platform. It empowers students and professionals by providing generative AI-driven resume analysis, skill gap detection, personalized career roadmap generation, and **Autonomous Mock Interviews**. 

The platform acts as a bridge between job seekers and their dream roles by identifying exactly what skills they lack and how to acquire them. Additionally, it features a **Mentorship Marketplace** and **Real-Time Chat**, connecting users with verified industry mentors for 1-on-1 guidance.

## Overall Tech Stack

**Languages:** JavaScript (ES6+), Python 3.10+

**Frontend Frameworks/Libraries:** React.js, Vite, React Router, Tailwind CSS, Framer Motion, Recharts

**Backend & API:** Node.js, Express.js, FastAPI (Python), RESTful APIs, WebSockets (Socket.io)

**Databases & Caching:** MongoDB (Mongoose), Redis

**AI & LLM Integration:** LangChain, Google Gemini, OpenAI, Anthropic Claude, Vector Embeddings (RAG)

**Authentication & Security:** JWT (JSON Web Tokens), bcrypt

**DevOps & Containerization:** Docker, Docker Compose

**Tools & Utilities:** Axios, Zod, React Hook Form, Multer, PyPDF2, pdf-parse, Git

The system is built on a robust architecture comprising three interconnected components:
1. **Frontend (`pathforge-ai`)**: A modern, interactive React/Vite UI.
2. **Backend Core (`backend-core`)**: A scalable Node.js/Express server handling authentication, database operations, websockets, and orchestrating requests.
3. **AI Engine (`ai-engine`)**: A dedicated Python/FastAPI microservice running vendor-agnostic AI inferences and LangChain autonomous agents.

All three services, along with **MongoDB** and **Redis**, are containerized using **Docker** and orchestrated via a single `docker-compose.yml` at the project root — enabling one-command deployment of the entire stack.

---

## Important Features

- **Generative Resume Analysis**: Upload your PDF resume to instantly extract text and receive a deep-dive ATS score. The AI highlights formatting issues, missing keywords, and evaluates your alignment with your target role.
- **Autonomous Mock Interviews (Powered by LangChain)**: Practice technical and behavioral interviews with an autonomous AI agent. The LangChain agent utilizes dynamic difficulty scaling, specific coding challenge generation, and real-time evaluation tools.
- **Personalized Career Roadmaps**: Based on your target role and current skill gap, the AI engine generates step-by-step, milestone-based career roadmaps to guide your learning journey.
- **Mentorship Marketplace**: Connect with experienced mentors, view their availability, book sessions, and get 1-on-1 guidance.
- **Real-Time Chat**: Integrated WebSockets (Socket.io) to allow seamless real-time messaging between students and mentors.
- **Production-Grade Security**: Secure JWT validation, Bcrypt password hashing, rate limiting, and structured data validation using Zod (Frontend) and Pydantic (AI).
- **Vendor-Agnostic AI Integration**: The AI microservice uses a Factory design pattern to swap between Google Gemini, OpenAI, and Anthropic Claude seamlessly without changing business logic.
- **Interactive Analytics Dashboard**: Visualize your resume performance, mock interview scores, and overall progress via beautiful dynamic charts.

---

## AI Engine Microservice

Production-grade AI microservice for the platform. Handles resume analysis, autonomous interviews, and roadmap generation using LangChain and generative AI.

### Architecture Design Patterns
- **Provider Pattern**: Vendor-agnostic AI provider abstraction
- **Factory Pattern**: Dynamic provider instantiation based on configuration
- **Dependency Injection**: Clean separation of concerns with FastAPI dependencies
- **LangChain Agents**: Tool-calling agents using ReAct logic for dynamic interviews.
- **Retrieval Augmented Generation (RAG)**: Used for grounding AI advice on real-world industry standards.

### Key Features
- **LangChain Interview Agent**: A custom AI agent with 5+ tools (`QuestionGenerator`, `AnswerEvaluator`, `BehavioralProber`, `DifficultyEscalator`) to autonomously conduct interviews.
- Vendor-agnostic AI provider system (Gemini, OpenAI, Claude)
- Strict schema validation with Pydantic
- Production-ready error handling and Rate-Limit retries
- Health check endpoints
- Comprehensive logging

### Switching AI Providers
The architecture is designed for easy provider switching:

**Option 1: Environment Variable**
```bash
# In .env file
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
```

**Supported Providers**
| Provider | Models | Configuration |
|----------|--------|---------------|
| **Gemini** | models/gemini-2.5-flash | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| **OpenAI** | gpt-4-turbo-preview | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| **Claude** | claude-3-sonnet-20240229 | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` |

---

## Backend Core

The **Backend Core** is the robust, scalable, and production-ready server-side application built with **Node.js** and **Express**. It handles authentication, user management, resume processing, and integration with the AI Engine.

### Backend Processing & WebSockets
- **Real-Time Communication**: Uses `Socket.io` for live chat between mentors and students.
- **Secure File Uploads**: Utilizes `multer` for handling `multipart/form-data` primarily for resume (PDF) uploads, with defined limits and type checking.
- **Text Extraction**: Integrated `pdf-parse-fork` to extract text content from uploaded resumes for AI analysis.
- **Data Validation**: Strict schema validation ensures that only consistent data enters the database logic.

### Production Ready Features
- **Security First**: Password hashing (`bcrypt`), account locking, environment configs, CORS policies.
- **Performance & Scalability**: Database indexing on frequently queried fields, lean queries, modular MVC architecture.
- **Reliability**: Centralized Error Handling, custom middleware, structured request logging.

### Routing System
Structured RESTful API routes:
- **Auth Routes** (`/api/auth`): Login, Signup, Session management.
- **Student Routes** (`/api/student`): Resume Upload & Analysis, Roadmaps.
- **Mentor Routes** (`/api/mentor`): Profile Management, Session Scheduling, Analytics.
- **Interview & Chat Routes** (`/api/interview`, `/api/chat`): Message histories, interview state handling.

### Schema Design
- **Student Schema**: Sub-documents for Location, Education, Skills. Stores resume versions, career roadmaps, and subscription limits.
- **Mentor Schema**: Expertise, availability windows, ratings, and active sessions.
- **Message & Session Schemas**: Tracking real-time chat histories and booked mentorship blocks.

---

## Project Structure

```text
ai-career-copilot/
├── pathforge-ai/               # Frontend React Application
│   ├── src/                    
│   │   ├── components/         # Reusable UI components (Sidebar, Navbar, Modals)
│   │   ├── context/            # React context providers (Auth)
│   │   ├── hooks/              # Custom React hooks (useResumes, useChat)
│   │   ├── pages/              # Application views (Dashboards, MockInterviewPage, ChatPage)
│   │   ├── services/           # API integration (resumeService, interviewService)
│   │   ├── App.jsx             # Main application component
│   │   └── index.css           # Global CSS (Tailwind utilities)
│   └── package.json            
├── backend-core/               # Node.js + Express Main Backend API
│   ├── controllers/            # Request handlers (Student, Mentor, Chat, Interview)
│   ├── middlewares/            # Custom middleware (Auth, Upload, Errors)
│   ├── models/                 # Mongoose Schemas (Student, Mentor, Message)
│   ├── routes/                 # API Route definitions
│   ├── services/               # aiEngine.service.js (Bridge to FastAPI)
│   ├── server.js               # Main entry point for backend server (Express + Socket.io)
│   └── package.json            
├── ai-engine/                  # Python FastAPI AI Microservice
│   ├── core/                   # LangChain Bridge, Factory, Prompts
│   ├── providers/              # LLM specific implementations (Gemini, OpenAI, Claude)
│   ├── services/               # interview_agent_service, rag_service, mentor_service
│   ├── schemas.py              # Request/response models (Pydantic)
│   ├── main.py                 # FastAPI application entry point
│   └── requirements.txt        # Python dependencies (LangChain, FastAPI, etc.)
└── docker-compose.yml          # Docker Compose — orchestrates all 5 services
```

---

## How to Run the Project on Another System

You can run the complete AI Career Copilot platform either using Docker (recommended) or by manually starting each service in separate terminals.

### Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas Connection String
- **AI API Key**: At least one active API Key (e.g., Google Gemini API Key)
- **Docker & Docker Compose**: (Optional) For containerized setup

---

### Running with Docker / Docker Compose (Recommended)

The easiest way to get the entire stack running together (Frontend, Backend, AI Engine, MongoDB, and Redis) is using Docker Compose.

1. Navigate to the project root directory where `docker-compose.yml` is located.
2. In the `ai-engine` folder, ensure you have copied `.env.example` to `.env` and added your API keys.
3. In the `backend-core` folder, do the same for its `.env`.
4. Run the following command to build and start all containers:
   ```bash
   docker-compose up --build
   ```
   *(To run in the background, use: `docker-compose up -d --build`)*

**Services will be mapped and accessible at:**
- **Frontend (PathForge UI):** http://localhost:5173
- **Backend Core API:** http://localhost:5000
- **AI Engine API:** http://localhost:8000

*(To stop the containers, run `docker-compose down`)*

---

### Manual Setup (Running services individually)

#### Step 1: Run the Backend Core
1. `cd backend-core`
2. `npm install`
3. Create a `.env` file with `PORT`, `MONGO_URI`, and `JWT_SECRET`.
4. `npm run dev`
*(The backend server will run on `http://localhost:5000`)*

#### Step 2: Run the AI Engine
1. `cd ai-engine`
2. `python -m venv venv`
3. `source venv/bin/activate` (On Windows: `venv\Scripts\activate`)
4. `pip install -r requirements.txt`
5. Configure `.env` with `AI_PROVIDER=gemini` and `GEMINI_API_KEY=...`
6. `uvicorn main:app --reload --port 8000`
*(Access interactive Swagger UI at: `http://localhost:8000/api/v1/docs`)*

#### Step 3: Run the Frontend (PathForge)
1. `cd pathforge-ai`
2. `npm install`
3. Create a `.env` with `VITE_API_BASE_URL=http://localhost:5000/api`
4. `npm run dev`
*(The React frontend will be accessible at `http://localhost:5173`)*

---
*Built with modern web technologies and advanced GenAI agents to empower the careers of tomorrow.*

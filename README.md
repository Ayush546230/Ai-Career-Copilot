# AI Career Copilot (PathForge AI)

> **GenAI powered Career Guidance Platform**

---

## Live Deployment

| Service | Platform | Link |
| :--- | :--- | :--- |
| **Frontend (PathForge AI)** | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) | [Visit Site](https://pathforgeai-zeta.vercel.app/) |
| **Backend Core API** | ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white) | [API Endpoint](https://ai-career-copilot-gxmv.onrender.com) |
| **AI Engine Microservice** | ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white) | [API Endpoint](https://ai-career-copilot-1-84c6.onrender.com) |

---

## Project Overview

**AI Career Copilot** (frontend known as **PathForge**) is a comprehensive, microservices-based career counseling platform. It empowers students and professionals by providing generative AI-driven resume analysis, skill gap detection, and personalized career roadmap generation. The platform acts as a bridge between job seekers and their dream roles by identifying exactly what skills they lack and how to acquire them. Additionally, it features a marketplace-like environment connecting users with verified industry mentors.

## Overall Tech Stack / Skills Section
**Languages:** JavaScript (ES6+), Python

**Frontend Frameworks/Libraries:** React.js, Vite, React Router, Tailwind CSS*, Framer Motion, Recharts

**Backend & API:** Node.js, Express.js, FastAPI (Python), RESTful APIs, Swagger/OpenAPI

**Databases & Caching:** MongoDB (Mongoose), Redis

**AI & LLM Integration:** Google Gemini, OpenAI, Anthropic Claude

**Authentication & Security:** JWT (JSON Web Tokens), bcrypt

**DevOps & Containerization:** Docker, Docker 

**Tools & Utilities:** Axios, Zod, React Hook Form, Multer, PyPDF2, pdf-parse, Git


The system is built on a robust architecture comprising three interconnected components:
1. **Frontend (`pathforge-ai`)**: A modern, interactive React/Vite UI.
2. **Backend Core (`backend-core`)**: A scalable Node.js/Express server handling authentication, database operations, and orchestrating requests.
3. **AI Engine (`ai-engine`)**: A dedicated Python/FastAPI microservice running vendor-agnostic AI inferences (Gemini, OpenAI, Claude).

All three services, along with **MongoDB** and **Redis**, are containerized using **Docker** and orchestrated via a single `docker-compose.yml` at the project root — enabling one-command deployment of the entire stack.

---

## Important Features

- Generative Resume Analysis: Upload your PDF resume to instantly extract text and receive a deep-dive ATS score. The AI highlights formatting issues, missing keywords, and evaluates your alignment with your target role.
- Personalized Career Roadmaps: Based on your target role and current skill gap, the AI engine generates step-by-step, milestone-based career roadmaps to guide your learning journey.
- Mentorship Marketplace: Connect with experienced mentors, view their availability, book sessions, and get 1-on-1 guidance.
- Production-Grade Security: Secure JWT validation, Bcrypt password hashing, rate limiting, and structured data validation using Zod (Frontend) and Pydantic (AI).
- Vendor-Agnostic AI Integration: The AI microservice uses a Factory design pattern to swap between Google Gemini, OpenAI, and Anthropic Claude seamlessly without changing business logic.
- Interactive Analytics Dashboard: Visualize your resume performance, mock interview scores, and overall progress via beautiful dynamic charts.

---

## AI Engine Microservice

Production-grade AI microservice for the platform. Handles resume analysis, skill gap detection, and career roadmap generation using generative AI.

### Architecture Design Patterns
- **Provider Pattern**: Vendor-agnostic AI provider abstraction
- **Factory Pattern**: Dynamic provider instantiation based on configuration
- **Dependency Injection**: Clean separation of concerns with FastAPI dependencies
- **Repository Pattern**: Centralized prompt management

### Key Features
- Vendor-agnostic AI provider system (Gemini, OpenAI, Claude)
- Strict schema validation with Pydantic
- Production-ready error handling
- Health check endpoints
- Structured prompt engineering (Chain of Thought)
- Type hints throughout
- Comprehensive logging
- CORS support
- Environment-based configuration

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

### Error Handling
The service provides detailed error responses:
| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `ValidationError` | 422 | Invalid request format |
| `AIAuthenticationError` | 503 | Invalid API key |
| `RateLimitExceeded` | 429 | Provider rate limit hit |
| `ServiceUnavailable` | 503 | Provider connection failed |
| `InvalidAIResponse` | 500 | AI returned malformed data |

---

## Backend Core

The **Backend Core** is the robust, scalable, and production-ready server-side application built with **Node.js** and **Express**. It handles authentication, user management, resume processing, and integration with the AI Engine.

### Backend File Writing & Processing
- **Secure File Uploads**: Utilizes `multer` for handling `multipart/form-data` primarily for resume (PDF) uploads, with defined limits and type checking.
- **Text Extraction**: Integrated `pdf-parse-fork` to extract text content from uploaded resumes for AI analysis.
- **Data Validation**: Strict schema validation ensures that only consistent data enters the database logic.

### Production Ready Features
- **Security First**:
    - **Password Hashing**: Implements `bcrypt` with salt generation in Mongoose pre-save hooks.
    - **Account Locking**: Protects against brute-force attacks by tracking `failedLoginAttempts` and locking accounts temporarily.
    - **Environment Configuration**: Uses `dotenv` for secure management of API keys, database URIs, and JWT secrets.
    - **CORS Policies**: Restricted cross-origin resource sharing for security.
- **Performance & Scalability**:
    - **Database Indexing**: Strategic indexing on frequently queried fields (e.g., `email`, `profile.targetRole`, `accountStatus`) to optimize read performance.
    - **Compound Indexes**: Used for complex queries like finding available mentors (`status` + `verification` + `availability`).
    - **Modular Architecture**: Service-oriented architecture with clear separation of concerns (Controllers, Services, Models, Routes).
    - **Lean Queries**: Utilization of `.lean()` in read-heavy operations for faster execution.
- **Reliability**:
    - **Centralized Error Handling**: Custom middleware to catch and format errors consistently relative to the environment (dev vs prod).
    - **Structured Logging**: Request logging in development and structured error logging.



### Routing System
Structured RESTful API routes:
- **Auth Routes** (`/api/auth`): Login, Signup, Session management.
- **Student Routes** (`/api/student`): Resume Upload & Analysis, Dashboard Analytics, Roadmap Generation.
- **Mentor Routes** (`/api/mentor`): Profile Management, Session Scheduling, Analytics.

### Schema Design
- **Student Schema**: Sub-documents for Location, Education, Skills. Stores resume versions, career roadmaps, and subscription limits. Vector embeddings fields for future AI semantic search.



### AI Analysis Screenshots

#### ATS Score Breakdown
![ATS Breakdown](./pathforge-ai/src/assets/Screenshots/Screenshot%202026-03-21%20220648.png)

#### Skill Gap Analysis
![Skill Gaps](./pathforge-ai/src/assets/Screenshots/Screenshot%202026-03-21%20220710.png)

#### AI Recommendations
![Recommendations](./pathforge-ai/src/assets/Screenshots/Screenshot%202026-03-21%20220726.png)

#### Personalized 8 Week Career Roadmap
![Roadmap](./pathforge-ai/src/assets/Screenshots/Screenshot%202026-03-21%20220751.png)

---

## Project Structure

```text
ai-career-copilot/
├── pathforge-ai/               # Frontend React Application
│   ├── src/                    # Source code
│   │   ├── assets/             # Images, fonts, static assets
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers (Auth, Theme)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Application views/routes
│   │   ├── services/           # API integration and external calls
│   │   ├── utils/              # Helper functions and formatting
│   │   ├── App.jsx             # Main application component
│   │   ├── main.jsx            # React DOM entry point
│   │   └── index.css           # Global CSS (Tailwind utilities)
│   ├── public/                 # Static public assets
│   ├── .env                    # Frontend environment variables
│   ├── index.html              # HTML template
│   ├── vite.config.js          # Vite bundler configuration
│   └── package.json            # Frontend dependencies
├── backend-core/               # Node.js + Express Main Backend API
│   ├── config/                 # Database and environment configs
│   ├── controllers/            # Request handlers (Business Logic)
│   ├── middlewares/            # Custom middleware (Auth, Upload, Errors)
│   ├── models/                 # Mongoose Schemas (Student, Mentor)
│   ├── routes/                 # API Route definitions
│   ├── services/               # External services & helper logic
│   ├── utils/                  # Utility functions
│   ├── server.js               # Main entry point for backend server
│   ├── .env                    # Environment variables
│   └── package.json            # Backend dependencies
├── ai-engine/                  # Python FastAPI AI Microservice
│   ├── providers/              # LLM specific implementations
│   │   ├── __init__.py         
│   │   ├── base.py             # Abstract base class for providers
│   │   ├── gemini.py           # Google Gemini implementation
│   │   ├── openai.py           # OpenAI implementation
│   │   └── claude.py           # Anthropic Claude implementation
│   ├── core/                   
│   │   ├── __init__.py         
│   │   ├── factory.py          # Provider factory logic
│   │   └── prompts.py          # Centralized prompt templates
│   ├── services/               
│   │   ├── __init__.py         
│   │   └── ai_service.py       # Core AI Business logic layer
│   ├── schemas.py              # Request/response models (Pydantic)
│   ├── dependencies.py         # Dependency injection for FastAPI
│   ├── config.py               # Config management (Pydantic Settings)
│   ├── main.py                 # FastAPI application entry point
│   ├── .env                    # Environment variables
│   └── requirements.txt        # Python package dependencies
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
2. In the `ai-engine` folder, ensure you have copied `.env.example` to `.env` and added your API keys (e.g., `GEMINI_API_KEY`, etc).
3. Run the following command to build and start all containers:
   ```bash
   docker-compose up --build
   ```
   *(To run in the background, use: `docker-compose up -d --build`)*

**Services will be mapped and accessible at:**
- **Frontend (PathForge UI):** http://localhost:5173
- **Backend Core API:** http://localhost:5000
- **AI Engine API:** http://localhost:8000
- **MongoDB:** `localhost:27017`
- **Redis:** `localhost:6379`

*(To stop the containers, run `docker-compose down`)*

---

### Manual Setup (Running services individually)

If you prefer to run the services manually without Docker, follow the steps below to start each service in its own terminal.

### Step 1: Run the Backend Core
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend-core
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend-core` folder:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development
   ```
4. Start the server (Development mode):
   ```bash
   npm run dev
   ```
   *(The backend server will now run on `http://localhost:5000`)*

### Step 2: Run the AI Engine

### Prerequisites
- Python 3.10+
- API key for at least one AI provider (Gemini, OpenAI, or Claude)

### Installation

1. **Clone and navigate to the project:**
```bash
cd ai-engine
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

### Configuration

Edit `.env` file:

```env
# Choose your AI provider
AI_PROVIDER=gemini  # Options: gemini, openai, claude

# Add the corresponding API key
GEMINI_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here

# Service configuration
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Running the Service

**Development:**
```bash
uvicorn main:app --reload --port 8000
```

**Production:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Using Python directly:**
```bash
python main.py
```

## API Documentation

Once running, access interactive documentation:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

### Step 3: Run the Frontend (PathForge)
1. Open a **third** terminal and navigate to the frontend directory:
   ```bash
   cd pathforge-ai
   ```
2. Install UI dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `pathforge-ai` folder (if your Vite app uses an API URL environment variable):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(The React frontend will now be accessible, usually at `http://localhost:5173`)*

---
*Built with modern web technologies to empower the careers of tomorrow.*


# 🚀 AI Career Copilot - Backend Core

The **Backend Core** is the robust, scalable, and production-ready server-side application for the AI Career Copilot platform. Built with **Node.js** and **Express**, it handles authentication, user management, resume processing, and integration with the AI Engine.

## 🌟 Features

### 📂 Backend File Writing & Processing
- **Secure File Uploads**: Utilizes `multer` for handling `multipart/form-data` primarily for resume (PDF) uploads, with defined limits and type checking.
- **Text Extraction**: Integrated `pdf-parse-fork` to extract text content from uploaded resumes for AI analysis.
- **Data Validation**: Strict schema validation ensures that only consistent data enters the database logic.

### ⚙️ Production Ready Features
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

### 🛣️ Routing System
Structured RESTful API routes for clear separation of resources:
- **Auth Routes** (`/api/auth`): Login, Signup, Session management, and MFA support.
- **Student Routes** (`/api/student`):
    - Resume Upload & Analysis
    - Dashboard Analytics
    - Career Roadmap Generation
- **Mentor Routes** (`/api/mentor`):
    - Profile Management
    - Session Scheduling & Availability
    - Analytics & Earnings
- **Health Check** (`/api`): Endpoints for monitoring server status.

### ♿ Accessibility & Standards
- **RESTful Standards**: Follows standard HTTP methods (GET, POST, PATCH, DELETE) and status codes.
- **JSON responses**: Universal data format for easy consumption.
- **Type Safety**: Mongoose schemas enforce types for all data fields, reducing runtime errors.

---

## 📦 Schema Design

The database schema is designed using **Mongoose** with a focus on data integrity, relationships, and future scalability for AI features.

### Student Schema (`models/Student.js`)
A comprehensive model managing the student's entire lifecycle.
- **Sub-documents**: Uses nested schemas for `Location`, `Education`, `TechnicalSkill`, and `SoftSkill` to keep documents organized.
- **Resume Management**: Stores multiple resume versions, parsing results, ATS scores, and AI-generated suggestions.
- **Career Roadmap**: Tracks milestones, tasks, and progress towards career goals.
- **Mentorship**: Manages relationships with mentors, session history, and payments.
- **Subscription**: Tracks usage limits (resume scans, mock interviews) and tier status.
- **Vector Embeddings**: Fields reserved for storing vector embeddings (`profileEmbedding`, `skillsEmbedding`) to power AI semantic search and matching.

### Mentor Schema (`models/Mentor.js`)
Designed to support a marketplace-like environment for mentors.
- **Professional Profile**: Detailed work experience, certifications, and domain expertise.
- **Availability System**: Complex scheduling logic with `WeeklySchedule` and `BlackoutDate` schemas.
- **Service & Pricing**: Flexible structure for defining session types, durations, and pricing packages.
- **Reputation System**: Built-in verification status (`verified`, `pending`) and a robust review/rating system.
- **Analytics**: Tracks engagement, earnings, and student outcomes.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt
- **File Handling**: Multer, PDF-Parse
- **Tools**: Nodemon (Dev), Dotenv, CORS, Axios

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (Local or Atlas URI)

### Installation

1.  **Navigate to the directory:**
    ```bash
    cd backend-core
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root of `backend-core` and add:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    NODE_ENV=development
    ```

4.  **Run the Server:**
    - **Development (with hot reload):**
      ```bash
      npm run dev
      ```
    - **Production:**
      ```bash
      npm start
      ```

---

## 📂 Project Structure

```
backend-core/
├── config/             # Database configurations
├── controllers/        # Request handlers (Business Logic)
├── middlewares/        # Custom middleware (Auth, Upload, Errors)
├── models/             # Mongoose Schemas (Data Layer)
├── routes/             # API Route definitions
├── services/           # External services & helper logic
├── utils/              # Utility functions
├── server.js           # Entry point
└── package.json        # Dependencies & Scripts
```

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/student/resume/upload` | Upload resume PDF for processing | Private (Student) |
| **GET** | `/api/student/dashboard` | Get student dashboard stats | Private (Student) |
| **GET** | `/api/student/roadmap` | Get generated career roadmap | Private (Student) |
| **GET** | `/api/student/resumes` | List all uploaded resumes | Private (Student) |
| **DELETE** | `/api/student/resumes/:id` | Delete a specific resume | Private (Student) |

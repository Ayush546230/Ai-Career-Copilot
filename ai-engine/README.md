# AI-Engine Microservice

Production-grade AI microservice for the **AI Career Copilot** platform. Handles resume analysis, skill gap detection, and career roadmap generation using generative AI.

## 🏗️ Architecture

### Design Patterns
- **Provider Pattern**: Vendor-agnostic AI provider abstraction
- **Factory Pattern**: Dynamic provider instantiation based on configuration
- **Dependency Injection**: Clean separation of concerns with FastAPI dependencies
- **Repository Pattern**: Centralized prompt management

### Key Features
- ✅ Vendor-agnostic AI provider system (Gemini, OpenAI, Claude)
- ✅ Strict schema validation with Pydantic
- ✅ Production-ready error handling
- ✅ Health check endpoints
- ✅ Structured prompt engineering (Chain of Thought)
- ✅ Type hints throughout
- ✅ Comprehensive logging
- ✅ CORS support
- ✅ Environment-based configuration

## 📁 Project Structure

```
ai-engine/
├── main.py                 # FastAPI entry point
├── config.py              # Configuration management (Pydantic Settings)
├── schemas.py             # Request/response models (Pydantic)
├── dependencies.py        # Dependency injection
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (gitignored)
├── .env.example          # Example environment configuration
├── providers/
│   ├── __init__.py
│   ├── base.py           # Abstract base class for providers
│   ├── gemini.py         # Google Gemini implementation
│   ├── openai.py         # OpenAI implementation
│   └── claude.py         # Anthropic Claude implementation
├── core/
│   ├── __init__.py
│   ├── factory.py        # Provider factory
│   └── prompts.py        # Centralized prompt templates
└── services/
    ├── __init__.py
    └── ai_service.py     # Business logic layer
```

## 🚀 Getting Started

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

## 📚 API Documentation

Once running, access interactive documentation:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

### Endpoints

#### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "ai-engine",
  "version": "1.0.0",
  "timestamp": "2024-02-05T10:30:00Z",
  "ai_provider": "gemini",
  "ai_provider_status": "connected"
}
```

#### Resume Analysis
```http
POST /api/v1/analyze-resume
Content-Type: application/json

{
  "resume_text": "John Doe\nSoftware Engineer\n...",
  "target_role": "Senior Backend Engineer"
}
```

Response:
```json
{
  "ats_score": {
    "overall": 78,
    "breakdown": {
      "formatting": 85,
      "keywords": 72,
      "experience": 80,
      "education": 90,
      "skills": 65
    }
  },
  "skill_gap_analysis": {
    "current_skills": ["Python", "FastAPI", "PostgreSQL"],
    "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
    "missing_skills": ["Docker", "Kubernetes"],
    "skills_to_improve": [
      {
        "skill": "System Design",
        "current_level": "beginner",
        "target_level": "intermediate",
        "priority": "high"
      }
    ]
  },
  "suggestions": [
    {
      "category": "keywords",
      "priority": "critical",
      "issue": "Missing cloud platform keywords",
      "recommendation": "Add specific cloud technologies",
      "example_before": "Worked on cloud infrastructure",
      "example_after": "Architected microservices on AWS using ECS"
    }
  ],
  "analyzed_at": "2024-02-05T10:30:00Z",
  "model_version": "models/gemini-2.5-flash"
}
```

## 🔄 Switching AI Providers

The architecture is designed for easy provider switching:

### Option 1: Environment Variable
```bash
# In .env file
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
```

### Option 2: Programmatic
```python
from core.factory import AIProviderFactory

# Create specific provider
provider = AIProviderFactory.create_provider(
    provider_type="claude",
    api_key="your-key",
    model="claude-3-sonnet-20240229"
)
```

### Supported Providers

| Provider | Models | Configuration |
|----------|--------|---------------|
| **Gemini** | models/gemini-2.5-flash | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| **OpenAI** | gpt-4-turbo-preview | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| **Claude** | claude-3-sonnet-20240229 | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` |

## 🧪 Testing

```bash
# Run health check
curl http://localhost:8000/health

# Test resume analysis
curl -X POST http://localhost:8000/api/v1/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume text here...",
    "target_role": "Software Engineer"
  }'
```

## 🔒 Error Handling

The service provides detailed error responses:

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `ValidationError` | 422 | Invalid request format |
| `AIAuthenticationError` | 503 | Invalid API key |
| `RateLimitExceeded` | 429 | Provider rate limit hit |
| `ServiceUnavailable` | 503 | Provider connection failed |
| `InvalidAIResponse` | 500 | AI returned malformed data |

## 📊 Logging

Logs include:
- Request/response details
- AI provider calls and latency
- Error traces
- Health check results

Configure log level in `.env`:
```env
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

## 🚢 Production Deployment

### Docker (Recommended)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t ai-engine .
docker run -p 8000:8000 --env-file .env ai-engine
```

### Environment Variables for Production

```env
ENVIRONMENT=production
LOG_LEVEL=WARNING
AI_TEMPERATURE=0.1
CORS_ORIGINS=https://your-domain.com
```

## 🔐 Security Best Practices

- ✅ Never commit `.env` to version control
- ✅ Use secrets management (AWS Secrets Manager, etc.)
- ✅ Implement API key rotation
- ✅ Enable HTTPS in production
- ✅ Add rate limiting middleware
- ✅ Validate and sanitize all inputs

## 📈 Performance Optimization

- Provider connection pooling (async)
- Response caching for repeated queries
- Request batching for high volume
- Horizontal scaling with load balancer

## 🤝 Integration with Main Platform

This microservice integrates with the AI Career Copilot backend:

```javascript
// Node.js/Express integration
const axios = require('axios');

async function analyzeResume(resumeText, targetRole) {
  const response = await axios.post(
    'http://ai-engine:8000/api/v1/analyze-resume',
    {
      resume_text: resumeText,
      target_role: targetRole
    }
  );
  return response.data;
}
```

## 📝 License

Part of the AI Career Copilot platform.

## 🆘 Support

For issues or questions, check the logs:
```bash
# View service logs
tail -f logs/ai-engine.log

# Check health
curl http://localhost:8000/health
```

---

**Built with FastAPI, Pydantic, and production-grade architecture patterns.**
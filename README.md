# Meeting Notes AI

This project was developed as part of a take-home assignment for a Full Stack AI-Powered Developer position.

The goal of the assignment was to design and implement a meeting transcription and summarization system using AI APIs, with an emphasis on clean system design, structured LLM outputs, and thoughtful AI integration.

> For detailed design decisions, prompt engineering, and development process, see `PROCESS.md`.

---

## What the system does

1. Accepts a meeting audio file (mp3 / wav / m4a)
2. Transcribes it using OpenAI Whisper
3. Generates a structured summary using an LLM (OpenAI or Claude)
4. Returns either:
   - Structured JSON summary  
   - A readable Word (.docx) document generated from that JSON

---

## Tech Stack

### Backend
- Python 3
- FastAPI
- Pydantic
- OpenAI Whisper API
- OpenAI / Anthropic Claude
- python-docx

### Frontend
- Not implemented yet

---

## Project Structure (High Level)

backend/
- app/
  - main.py
  - config.py
  - routes/
  - services/
  - schemas/
  - prompts/
- samples/
- uploads/
- requirements.txt
- .env.example

---

## Environment Setup

### Prerequisites
- Python 3.10+
- API keys:
  - OPENAI_API_KEY
  - ANTHROPIC_API_KEY (optional)

### Create & activate virtual environment

Windows:
```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:
```
python3 -m venv .venv
source .venv/bin/activate
```

### Install dependencies
```
pip install -r backend/requirements.txt
```

### Environment variables

Create backend/.env from backend/.env.example and fill in:
```
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```
> The API returns HTTP 503 if required keys are missing or quota is exceeded

---

## Running the Backend

From the project root:
```
cd backend
uvicorn app.main:app --reload
```

Swagger UI:
http://127.0.0.1:8000/docs

---

## API Overview

- GET /health
- POST /transcribe
- POST /summarize
- POST /process
- POST /export/docx

---

## Design Notes

- Clear separation between routes, services, and schemas
- LLMs are prompted to return structured JSON matching a strict schema
- Word export is generated only from validated JSON
- Backend-first design, frontend intentionally minimal

---

## Future Improvements
> Some of these improvements are within the scope of the assignment, while others are forward-looking ideas.

- Frontend UI for upload & download
- Async job handling for long audio
- Persistent storage (jobs, transcripts, summaries)


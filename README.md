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

### Core Design Principles
The system always produces a validated structured JSON summary as its internal source of truth.

When requested, a Word (.docx) document is generated strictly from this JSON, either:
- directly via `/process?output=docx`, or
- via a dedicated `/export/docx` endpoint using an existing summary.

This approach ensures consistency, debuggability, and a clear separation between processing and presentation.

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
- React (Vite)
- Vanilla CSS (inline styles)
- Fetch API

---

## Project Structure (High Level)

backend/
- app/
  - routes/        # API layer
  - services/      # Business logic & AI integrations
  - schemas/       # Strict Pydantic schemas
  - prompts/       # LLM prompt templates
- main.py          # App composition
- requirements.txt

frontend/
- src/
  - App.jsx        # Main UI logic
  - main.jsx       # React entry point
- index.html
- vite.config.js

---

## Environment Setup

### Prerequisites
- Python 3.10+
- API keys:
  - OPENAI_API_KEY
  - ANTHROPIC_API_KEY (optional)

### Backend Setup
1. Create & activate virtual environment

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

2. Install backend dependencies
```
pip install -r backend/requirements.txt
```

3. Environment variables
Create a `backend/.env` file and set:
```
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here (optional)
```
> The API returns HTTP 503 if required keys are missing or quota is exceeded


### Frontend Setup
The frontend requires no secrets by default.

Optional configuration:
- `VITE_API_BASE_URL` in `frontend/.env` to point to a custom backend URL.

---

## API Overview

- GET /health
- POST /transcribe
- POST /summarize
- POST /process
- POST /export/docx

### API Documentation (Swagger UI)
Once the backend is running, interactive API docs are available at:
http://127.0.0.1:8000/docs

---

## Frontend Overview

A lightweight React frontend was implemented to demonstrate end-to-end system usage.

The UI allows the user to:
1. Upload an audio file (mp3 / wav / m4a)
2. Select an LLM provider (OpenAI or Claude)
3. Choose output format (JSON or Word)
4. Run the full transcription + summarization pipeline
5. Copy structured JSON output
6. Download a Word (.docx) summary generated from validated JSON

### Design Goals
- Minimal and clear UI
- Explicit user feedback during long-running operations
- No heavy UI frameworks to keep focus on system design
- Clear separation between processing and export (JSON first, optional Word export)

### UX Notes
- Loading states and user-friendly messages are shown during long processing
- File size validation is performed before upload with a clear error message
- The UI intentionally stays simple to emphasize backend and AI integration

---

## Running the Application (End-to-End)

The system consists of a backend API and a frontend UI, which should be run in parallel.

1. Start the backend (Terminal 1):
From the project root:
```
cd backend
uvicorn app.main:app --reload
```

2. Start the frontend (Terminal 2):
From the project root:
```
cd frontend
npm install
npm run dev
```

3. Open the frontend in the browser:
http://localhost:5173


> The frontend API base URL can be configured via `VITE_API_BASE_URL` in `frontend/.env`

---

## Design Notes

- Clear separation between routes, services, and schemas
- LLMs are prompted to return structured JSON matching a strict schema
- Word export is generated only from validated JSON
- Backend-first design, frontend intentionally minimal
- Frontend consumes only validated backend outputs (JSON as the single source of truth)

---

## Future Improvements
- Async job handling for long audio
- Job status tracking and progress reporting
- Persistent storage (jobs, transcripts, summaries)
- Customizable summary templates
- Rate limiting and abuse protection
- Cloud storage integration (S3 / GCS)

## Known Limitations
- Audio length and file size are limited by the transcription provider
- Processing time depends on audio duration and external API latency
- No persistence between runs (stateless by design)

## Error Handling
The system returns clear HTTP status codes and user-friendly error messages for:
- Invalid input
- External API failures
- Validation errors in LLM output

### Input Validation & Safety Considerations
The system includes basic validation such as:
- File size limits for uploaded audio
- Explicit error handling for failed transcription or summarization requests

Additional production-level safeguards (e.g. authentication, rate limiting, file type enforcement, sandboxing) were intentionally left out, as they were outside the scope of this assignment.

--- 

## Testing

The system was tested locally using the provided frontend UI and the Swagger UI (`/docs`) to validate the full end-to-end flow.

---

## Closing Note

A focused end-to-end demo of an AI meeting transcription and structured summarization pipeline, built with production-minded boundaries and validated outputs.
Advanced production concerns (auth, persistence, async workers) were intentionally left out to match the assignment scope.

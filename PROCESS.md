## Overview
This project is a full-stack AI-powered system for meeting transcription and structured summarization.  

Users upload an audio recording (mp3/wav), which is transcribed using an automatic speech recognition model. The resulting transcript is then processed by a large language model (LLM) to generate a structured meeting summary, including key decisions and action items. The output is presented in a simple UI and can be exported as a Word (.docx) file.

The goal of this project is to demonstrate practical AI integration, thoughtful system design, and effective use of prompting strategies rather than building a production-ready system.

---

## Planning
Before starting the implementation, I will define a clear and minimal scope for the project.
Given the limited time frame, I will intentionally avoid unnecessary complexity such as authentication, databases, or deployment pipelines.

Key planning dsicions will include:
- Focusing on a single-user, single-file flow.
- Prioritizing correctness, clarity, and AI usage quality over UI complexity.
- Treating the project as a functional POC.
- Emphasizing explainability and reasoning through documentation.

---

## Project Structure
- `backend/`: FastAPI service (upload, transcription, summarization, export)
- `frontend/`: minimal UI (upload + results view)
- `PROCESS.md`: planning + development notes
- `README.md`: setup and run instructions

---

## Architecture
The system will follow a simple client-server architecture:
1. The frontend will allow the user to upload an audio file.
2. The backend will receive the file and send it to a transcription service (Whisper API or equivalent).
3. The full transcript will be passed to an LLM along with a predefined system prompt.
4. The LLM will return a structured JSON output containing the meeting summary, participants (best-effort), decisions, and action items.
5. The backend will return the results to the frontend for display.
6. In the end, the backend will generate a Word document containing the transcript and summary, either automatically or upon user request.

All processing will be stateless and synchronous for simplicity.

---

## Implementation Plan
The implementation will be done step by step, focusing on one component at a time.
1. Create the initial repository structure and documentation skeleton.
2. Set up the backend with FastAPI and basic health checks.
3. Implement audio upload and transcription integration.
4. Add LLM-based summarization with a strict structured output schema.
5. Build a minimal frontend for upload and result display.
6. Implement Word (.docx) export functionality.
7. Perform final refinements, error handling, and documentation updates.

---

## Prompting Strategy
> TBD: Define a system prompt
- Several prompt styles were explored, including schema-first prompting and strict extraction rules. 
The final prompt whill be chosen for its balance between clarity, robustness, and minimal hallucination, while maintaining a professional, human-readable tone.
> TBD: Define the JSON schema for:
- summary
- participants (best-effort)
- decisions
- action_items

---

## Using AI During Development
> TBD: Document where AI tools were used (API usage, prompt iterations) + example prompts.
- Used AI to generate diverse sample meeting transcripts (clean, mixed, and messy) in order to validate the robustness of the summarization prompts and structured output.

---

## Issues & Resolutions
> TBD: Track issues encountered and resolutions.
- Handling multi-line transcripts in JSON requests:
  Multi-line transcript inputs initially caused JSON parsing errors (422 Unprocessable Content). This was resolved by requiring JSON-safe newline escaping (`\n`) for all multi-line transcript inputs, ensuring compatibility with FastAPI request parsing and API-based clients such as Swagger and curl.
---

## Time Spent
- Planning and design: ~50 min
- Backend development: TBD
- Frontend development: TBD
- Documentation and polishing: TBD

- Total time: 

---

## Tradeoffs & Future Improvements
> TBD: Note intentional scope cuts (no diarization, no DB, minimal UI) + possible next steps.
- Whisper transcription relies on the OpenAI API and requires active billing.
  During development, API quota limitations may result in 429 errors.
  The system handles this gracefully by returning a clear 503 response.
  End-to-end testing with real transcripts can be enabled later by activating billing.
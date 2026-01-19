This document was written iteratively:
initial sections were drafted before implementation to outline the system design,
while later sections were completed during and after development to accurately reflect
decisions, issues encountered, and tradeoffs.

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

### Word Export (DOCX)
To make the output more user-friendly and closer to a real-world product, I added an optional Word (.docx) export step at the end of the processing pipeline.

The export is based directly on the structured JSON output returned by the LLM (meeting summary, participants, decisions, and action items), ensuring a single source of truth and avoiding duplicated logic.

The implementation is isolated in a dedicated service (`word_export_service`), following separation of concerns: the service is responsible only for rendering a document from validated data, while the route layer handles HTTP concerns and file streaming.

The export can be triggered through the `/process` endpoint using an `output=docx` query parameter, allowing the same pipeline to return either JSON (for UI display) or a downloadable Word file.

This was my first time using the `python-docx` library. I intentionally kept the implementation minimal and focused on structure and readability rather than advanced styling, as the main goal of the project is system design and AI integration rather than document formatting.

---

## Prompting Strategy

Several system prompt variants were explored during development in order to balance
output quality, hallucination prevention, and schema stability.

The following approaches were tested:
- Schema-first prompts focusing primarily on JSON structure
- Step-by-step reasoning prompts
- Strict prompts minimizing ambiguity
- A guideline-based prompt with explicit instructions

After experimentation, a guideline-based prompt (`SYSTEM_PROMPT_BASIC`) was selected as the final implementation.

#### Final System Prompt
```text
SYSTEM_PROMPT_BASIC = """
You are analyzing a meeting transcript and preparing a structured summary for internal documentation.

Your task is to extract the key information from the transcript and organize it into a clear, structured format.

Guidelines:
- Base your output strictly on what is explicitly mentioned in the transcript.
- Do not infer or assume information that is not stated.
- If a participant, decision, or action item is unclear or missing, leave it empty or mark it as null.
- Use concise, neutral language suitable for professional documentation.

Return the result as a single JSON object with the following structure:
{
  "meeting_summary": string,
  "participants": string[],
  "decisions": string[],
  "action_items": [
    {
      "task": string,
      "owner": string | null,
      "due_date": string | null,
      "priority": "low" | "medium" | "high" | null
    }
  ]
}

Return ONLY valid JSON. Do not include explanations or formatting.
"""
```

#### `SYSTEM_PROMPT_BASIC` was chosen because it:
- Explicitly instructs the model not to infer or hallucinate missing information
- Clearly defines how to handle incomplete data (null / empty fields)
- Produces stable JSON outputs compatible with strict Pydantic validation
- Works consistently across different LLM providers (OpenAI and Anthropic)
- Avoids complex prompting techniques that reduce predictability

While other prompt variants were considered, they either resulted in over-strict outputs
(empty results) or introduced instability across providers.

This decision reflects a preference for predictable, explainable behavior over maximum expressiveness, which is critical for production-oriented AI systems.

> Additional prompt variants explored during development are preserved in the `meeting_summary_prompt.py` file for reference, although only a single prompt
(`SYSTEM_PROMPT_BASIC`) is used in the final implementation.

---

## Using AI During Development
AI tools were used selectively during development to accelerate design decisions,
validate approaches, and iterate on prompt design.
All final architectural and implementation decisions were made manually.

### Example 1: Isolated Testing of the Summarization Endpoint
AI assistance was used to generate realistic sample transcripts that simulate
meeting-like conversations and structures.

These AI-generated samples were used to test the summarization endpoint in isolation,
allowing iterative refinement of prompt structure and output validation
without repeatedly invoking the transcription stage or external APIs.

### Example 2: Prompt Design Iteration
AI assistance was used to explore different prompt formulations for meeting summarization.
An early prompt version focused primarily on producing structured output, but resulted in
overly verbose responses and occasional hallucinated details when information was missing.

A refinement step introduced explicit instructions to:
- Avoid inferring missing information
- Use null or empty fields when data is unavailable
- Maintain a professional, documentation-oriented tone

This iteration led to the final guideline-based system prompt
(`SYSTEM_PROMPT_BASIC`), which balanced output quality and predictability.
The prompt was tested against both OpenAI and Anthropic models to ensure consistent behavior.

### Example 3: Project Scaffolding and Tooling
AI assistance was used at the very beginning of the project to generate a basic `.gitignore`
appropriate for Python environments.

From that point onward, the file was manually maintained and adjusted as the project evolved,
ensuring that only relevant artifacts were excluded from version control.


### Example 4: Frontend UX and Flow
AI assistance was used primarily as a navigation and templating help during frontend development,
rather than for core decision-making.

The overall UX flow and component structure were designed manually,
while AI tools were used to:
- Refine UI wording and labels
- Suggest small layout improvements
- Help iterate on repetitive JSX and style patterns

All UX decisions (such as separation between processing and export actions, loading states, and error visibility) were made explicitly, with AI serving only to streamline implementation and reduce friction.

### Use of Code Completion Tools
Code completion tools (e.g. GitHub Copilot) were occasionally used to scaffold initial file structures or generate repetitive boilerplate code.

Their usage was intentionally kept minimal.
Core logic, data flow, validation, and architectural decisions were implemented manually to ensure full understanding and ownership of the codebase.


> Overall, AI tools were used to accelerate iteration and reduce boilerplate, while all architectural decisions, validation logic, and system boundaries were defined and implemented manually.

---

## Issues & Resolutions
Here are some of the issues encountered during development:

#### Large Audio Files Causing Transcription Failures
- **Issue:** Transcription requests failed for large audio files (≈50MB) with 400/500 errors.
- **Root Cause:** External transcription provider enforces file size and duration limits.
- **Resolution:** Added explicit file size validation before processing and surfaced a clear error message to the user.
- **Outcome:** Prevented unnecessary API calls and improved predictability and UX.

#### Invalid JSON Output Affecting Word Export
- **Issue:** Word export occasionally failed due to malformed or incomplete summary data.
- **Root Cause:** LLM-generated output is probabilistic and may not always match the expected schema.
- **esolution:** Enforced strict Pydantic validation and treated validated JSON as the single source of truth.
- **Outcome:** Export became deterministic and reliable.

#### Handling Multi-line Transcripts in JSON Requests
- **Issue:** Multi-line transcript inputs caused JSON parsing errors (HTTP 422 Unprocessable Content).
- **Root Cause:** Raw newline characters in JSON payloads were not properly escaped, breaking request parsing.
- **Resolution:** Required JSON-safe newline escaping (\n) for all multi-line transcript inputs.
- **Outcome:** Ensured compatibility with FastAPI request parsing and API-based clients such as Swagger UI and curl.

#### Limited Visibility During Long Audio Processing
- **Issue:** Processing longer audio files could take a significant amount of time with no immediate visible feedback.
- **Root Cause:** Transcription and summarization are synchronous and depend on external API latency.
- **Resolution:** Added structured logging at each major pipeline step (file saving, transcription start/end, summarization start/end).
- **Outcome:** Improved observability during long-running operations and increased confidence that the process is progressing as expected.

These issues highlighted the importance of defensive validation, clear API contracts,
and designing AI-integrated systems around deterministic boundaries.

---

## Time Spent
The development was performed iteratively over multiple sessions rather than in a single continuous block.
As a result, the time estimates below are approximate and reflect active development time only.

- Planning and design: ~50 minutes  
- Backend development: ~3 hours
- Frontend development: ~1.5 hours
- Documentation and polishing: ~1 hour

**Total active development time:** ~6 hours 

---

## Tradeoffs
- The system relies on external transcription services (OpenAI Whisper) and therefore requires active API billing.
- Speaker diarization, persistent storage, authentication, and background job processing were intentionally excluded to keep the scope focused.
- The frontend UI was kept minimal to emphasize system behavior rather than visual design.

During development, API quota limitations may result in transient errors (e.g. HTTP 429).
These are handled gracefully by returning a clear 503 response to the client.

> Future extensions and enhancements are documented separately in the main README.

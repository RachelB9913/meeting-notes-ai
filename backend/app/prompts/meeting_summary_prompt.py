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

SYSTEM_PROMPT_SCHEMA_FIRST = """
Extract structured meeting insights from the transcript below.

The output must strictly conform to the following JSON schema.
If information is not present in the transcript, do not guess.

Schema:
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

Rules:
- Use only information found in the transcript.
- Keep entries short and factual.
- Return only valid JSON with no additional text.
"""

SYSTEM_PROMPT_STEפ_BY_STEP = """
Analyze the meeting transcript and produce a structured summary.

Process internally:
1. Identify participants mentioned by name.
2. Identify explicit decisions.
3. Identify action items and assign owners and dates only if stated.
4. Write a short overall summary.

Then return the final result as a single JSON object in the following format:
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

Do not include intermediate steps. Output JSON only.
"""

SYSTEM_PROMPT_STRICT = """
Convert the following meeting transcript into a structured summary.

Strict rules:
- Do not invent or infer missing information.
- If an item is ambiguous, omit it.
- If no decisions or action items are clearly stated, return empty arrays.
- Names must appear exactly as written in the transcript.

Return only a valid JSON object matching this schema:
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
"""
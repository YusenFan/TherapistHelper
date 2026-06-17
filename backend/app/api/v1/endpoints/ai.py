"""
AI endpoints:
  - POST /api/v1/ai/transcribe   — multilingual speech-to-text via Deepgram
  - POST /api/v1/ai/generate-note — turn a session summary into structured
    note sections via Tinfoil (OpenAI-compatible).
"""
from __future__ import annotations

import json
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.config import settings

router = APIRouter()


class TranscribeResponse(BaseModel):
    transcript: str
    language: Optional[str] = None


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    therapist_id: str = Depends(get_current_user_id),
) -> TranscribeResponse:
    if not settings.DEEPGRAM_API_KEY:
        raise HTTPException(500, "DEEPGRAM_API_KEY not configured")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio upload")

    params: dict[str, str] = {
        "model": settings.DEEPGRAM_MODEL,
        "smart_format": "true",
        "punctuate": "true",
    }
    # Nova-3 supports multilingual auto-detect via language=multi
    params["language"] = language or "multi"

    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": audio.content_type or "application/octet-stream",
    }

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            "https://api.deepgram.com/v1/listen",
            params=params,
            headers=headers,
            content=audio_bytes,
        )
    if r.status_code >= 400:
        raise HTTPException(502, f"Deepgram error: {r.text}")

    data = r.json()
    try:
        alt = data["results"]["channels"][0]["alternatives"][0]
        transcript = alt.get("transcript", "")
        detected = data["results"]["channels"][0].get("detected_language")
    except (KeyError, IndexError):
        raise HTTPException(502, "Unexpected Deepgram response shape")

    return TranscribeResponse(transcript=transcript, language=detected)


class GenerateNoteRequest(BaseModel):
    summary: str
    note_format: Optional[str] = None
    sections: List[str]
    client_context: Optional[str] = None


class GenerateNoteResponse(BaseModel):
    note_content: dict


SYSTEM_PROMPT = (
    "You are a licensed clinical therapist's documentation assistant. "
    "Given a free-text session summary and a list of required note sections, "
    "produce concise, clinically appropriate content for each section. "
    "Use professional, neutral, third-person language. Never invent facts that "
    "are not implied by the summary. If a section cannot be supported, write a "
    "single sentence acknowledging insufficient information."
)


def _build_user_prompt(req: GenerateNoteRequest) -> str:
    parts: list[str] = []
    if req.note_format:
        parts.append(f"Note format: {req.note_format.upper()}")
    if req.client_context:
        parts.append(f"Client context:\n{req.client_context}")
    parts.append(f"Session summary:\n{req.summary}")
    parts.append("Required sections:\n- " + "\n- ".join(req.sections))
    parts.append(
        "Return a JSON object whose keys are EXACTLY the section names above and "
        "whose values are strings containing the section content. Do not include "
        "any other keys or commentary."
    )
    return "\n\n".join(parts)


@router.post("/generate-note", response_model=GenerateNoteResponse)
async def generate_note(
    req: GenerateNoteRequest,
    therapist_id: str = Depends(get_current_user_id),
) -> GenerateNoteResponse:
    if not settings.TINFOIL_API_KEY:
        raise HTTPException(500, "TINFOIL_API_KEY not configured")
    if not req.summary.strip():
        raise HTTPException(400, "Summary is required")
    if not req.sections:
        raise HTTPException(400, "At least one section is required")

    payload = {
        "model": settings.TINFOIL_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(req)},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {settings.TINFOIL_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            f"{settings.TINFOIL_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
    if r.status_code >= 400:
        raise HTTPException(502, f"Tinfoil error: {r.text}")

    data = r.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise HTTPException(502, "Unexpected Tinfoil response shape")

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        # Best-effort: extract the first JSON object substring
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1:
            raise HTTPException(502, "LLM did not return JSON")
        try:
            parsed = json.loads(content[start : end + 1])
        except json.JSONDecodeError:
            raise HTTPException(502, "LLM did not return valid JSON")

    note_content = {s: str(parsed.get(s, "")).strip() for s in req.sections}
    return GenerateNoteResponse(note_content=note_content)

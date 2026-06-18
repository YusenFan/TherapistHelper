"""
AI endpoints:
  - POST /api/v1/ai/transcribe          — file speech-to-text via OpenAI
    (gpt-4o-transcribe / gpt-4o-transcribe-diarize). Auto-detects language
    by default, so mixed-language audio (e.g. Chinese + English) is handled
    natively.
  - POST /api/v1/ai/realtime/sdp        — proxy a browser WebRTC SDP offer to
    OpenAI Realtime transcription sessions; returns the SDP answer. Keeps the
    OpenAI API key server-side.
  - POST /api/v1/ai/generate-note       — turn a session summary into
    structured note sections via Tinfoil (OpenAI-compatible chat).
"""
from __future__ import annotations

import json
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.auth import get_current_user_id
from app.core.config import settings

router = APIRouter()


class TranscribeResponse(BaseModel):
    transcript: str
    language: Optional[str] = None


class RealtimeClientSecretResponse(BaseModel):
    value: str
    expires_at: Optional[int] = None


@router.get("/realtime/client-secret", response_model=RealtimeClientSecretResponse)
async def realtime_client_secret(
    therapist_id: str = Depends(get_current_user_id),
) -> RealtimeClientSecretResponse:
    """Mint an ephemeral OpenAI Realtime client secret for browser WebRTC.

    Configures a transcription-only session using gpt-realtime-whisper for
    streaming transcript deltas. Language is intentionally not specified so
    the model auto-detects, which lets it handle mixed-language audio
    (e.g. Chinese + English code-switching).
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(500, "OPENAI_API_KEY not configured")

    # gpt-realtime-whisper does not support server VAD — turn_detection must be
    # omitted and the client commits the input audio buffer manually. We do that
    # with a periodic commit timer on the frontend.
    body = {
        "session": {
            "type": "transcription",
            "audio": {
                "input": {
                    "transcription": {
                        "model": settings.OPENAI_REALTIME_MODEL,
                    },
                }
            },
        }
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            "https://api.openai.com/v1/realtime/client_secrets",
            headers=headers,
            json=body,
        )
    if r.status_code >= 400:
        raise HTTPException(502, f"OpenAI client_secrets error: {r.text}")

    data = r.json()
    # The response shape is { "value": "ek_...", "expires_at": <unix>, "session": {...} }
    value = data.get("value") or (data.get("client_secret") or {}).get("value", "")
    expires_at = data.get("expires_at") or (data.get("client_secret") or {}).get("expires_at")
    if not value:
        raise HTTPException(502, f"OpenAI client_secrets missing token: {data}")
    return RealtimeClientSecretResponse(value=value, expires_at=expires_at)


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    diarize: Optional[str] = Form(None),
    therapist_id: str = Depends(get_current_user_id),
) -> TranscribeResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(500, "OPENAI_API_KEY not configured")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty audio upload")

    diarize_on = str(diarize).lower() in ("1", "true", "yes", "on")

    # "multi" is a Deepgram-ism; for OpenAI we just omit the language hint
    # to let the model auto-detect (handles mixed Chinese/English etc.).
    lang_hint = (language or "").strip()
    if lang_hint.lower() in ("", "multi", "auto"):
        lang_hint = ""

    model = settings.OPENAI_TRANSCRIBE_DIARIZE_MODEL if diarize_on else settings.OPENAI_TRANSCRIBE_MODEL
    data: dict[str, str] = {"model": model}
    if diarize_on:
        # Required for clips longer than 30s and harmless for shorter ones.
        data["response_format"] = "diarized_json"
        data["chunking_strategy"] = "auto"
    else:
        data["response_format"] = "json"
        if lang_hint:
            data["language"] = lang_hint

    files = {
        "file": (
            audio.filename or "audio",
            audio_bytes,
            audio.content_type or "application/octet-stream",
        ),
    }
    headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}

    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers,
            data=data,
            files=files,
        )
    if r.status_code >= 400:
        raise HTTPException(502, f"OpenAI transcribe error: {r.text}")

    body = r.json()

    if diarize_on:
        segments = body.get("segments") or []
        lines: list[str] = []
        current_speaker: Optional[str] = None
        buffer: list[str] = []
        for seg in segments:
            spk = str(seg.get("speaker") or "1")
            text = (seg.get("text") or "").strip()
            if not text:
                continue
            if spk != current_speaker and buffer:
                lines.append(f"Speaker {current_speaker}: {' '.join(buffer).strip()}")
                buffer = []
            current_speaker = spk
            buffer.append(text)
        if buffer:
            lines.append(f"Speaker {current_speaker}: {' '.join(buffer).strip()}")
        transcript = "\n".join(lines) if lines else (body.get("text") or "")
    else:
        transcript = body.get("text") or ""

    return TranscribeResponse(transcript=transcript, language=body.get("language"))


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

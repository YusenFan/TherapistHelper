"""
LLM Service using Tinfoil.sh API for confidential client data
"""
import httpx
from app.core.config import settings
from typing import Dict, List, Optional, Any
import json


class TinfoilLLMService:
    """Service for LLM operations using Tinfoil.sh API"""

    def __init__(self):
        self.api_key = settings.TINFOIL_API_KEY
        self.api_endpoint = settings.TINFOIL_API_ENDPOINT
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def _make_request(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """
        Make a request to Tinfoil.sh API

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            dict: API response
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.api_endpoint}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            raise Exception(f"Tinfoil API request error: {str(e)}")
        except Exception as e:
            raise Exception(f"LLM error: {str(e)}")

    async def analyze_transcript(
        self,
        transcript: str,
        client_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a session transcript and generate insights

        Args:
            transcript: The session transcript text
            client_context: Client background information

        Returns:
            dict: {
                'summary': str,
                'key_points': List[str],
                'emotional_state': str,
                'progress_indicators': List[str],
                'recommendations': List[str]
            }
        """
        # Build context-aware prompt
        system_prompt = """You are an expert therapist AI assistant. Analyze the session transcript and provide:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Client's emotional state during the session
4. Any progress indicators or positive changes
5. Therapist recommendations for future sessions

Be professional, empathetic, and focused on therapeutic outcomes."""

        user_prompt = f"Analyze this therapy session transcript:\n\n{transcript}"

        # Add client context if available
        if client_context:
            context_str = f"\n\nClient Context:\n{json.dumps(client_context, indent=2)}"
            user_prompt += context_str

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self._make_request(messages, temperature=0.7)
        content = response['choices'][0]['message']['content']

        # Parse the structured response
        return self._parse_analysis_response(content)

    async def generate_session_agenda(
        self,
        client_context: Dict[str, Any],
        previous_sessions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate a pre-session agenda and guidelines

        Args:
            client_context: Client background information
            previous_sessions: List of previous session summaries

        Returns:
            dict: {
                'agenda': List[str],
                'suggested_questions': List[str],
                'engagement_activities': List[str],
                'focus_areas': List[str]
            }
        """
        system_prompt = """You are an expert therapist AI assistant. Generate a session agenda and preparation guidelines based on the client's profile and history.

Provide:
1. Session agenda (3-5 key points to cover)
2. Suggested questions to ask (open-ended, therapeutic)
3. Engagement activities (games, exercises, or techniques)
4. Focus areas (what to pay attention to)"""

        user_prompt = f"Client Context:\n{json.dumps(client_context, indent=2)}\n\n"

        if previous_sessions:
            user_prompt += f"Previous Sessions:\n{chr(10).join(previous_sessions)}\n\n"

        user_prompt += "Generate a session preparation plan."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self._make_request(messages, temperature=0.8)
        content = response['choices'][0]['message']['content']

        return self._parse_agenda_response(content)

    async def generate_session_log(
        self,
        transcript: str,
        client_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a structured session log for documentation

        Args:
            transcript: Session transcript
            client_context: Client background

        Returns:
            dict: {
                'session_date': str,
                'duration': str,
                'topics_discussed': List[str],
                'observations': str,
                'interventions_used': List[str],
                'homework_assigned': Optional[str],
                'next_session_focus': str
            }
        """
        system_prompt = """You are an expert therapist AI assistant. Generate a structured clinical session log based on the transcript.

Format the response as a professional clinical note with:
1. Topics discussed (bullet list)
2. Clinical observations
3. Interventions used
4. Homework or assignments (if any)
5. Next session focus

Be thorough but concise, appropriate for clinical documentation."""

        user_prompt = f"Generate a clinical session log from this transcript:\n\n{transcript}"

        if client_context:
            user_prompt += f"\n\nClient Context:\n{json.dumps(client_context, indent=2)}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self._make_request(messages, temperature=0.6)
        content = response['choices'][0]['message']['content']

        return self._parse_session_log_response(content)

    async def analyze_client_background(
        self,
        transcript: str,
        existing_background: Optional[str] = None
    ) -> str:
        """
        Analyze transcript and extract insights to update client background

        Args:
            transcript: Session transcript
            existing_background: Current client background

        Returns:
            str: Updated client background information
        """
        system_prompt = """You are an expert therapist AI assistant. Analyze the session transcript and extract or update the client's background information.

Focus on:
- New information about family structure
- Important life events mentioned
- Health updates (physical or mental)
- Work or school changes
- Relationship status changes
- Other relevant background information

Provide a concise update that can be added to the client's profile."""

        user_prompt = f"Transcript:\n{transcript}\n\n"

        if existing_background:
            user_prompt += f"Existing Background:\n{existing_background}\n\n"

        user_prompt += "Extract new or updated background information."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = await self._make_request(messages, temperature=0.5)
        return response['choices'][0]['message']['content']

    async def chat_with_context(
        self,
        message: str,
        client_context: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Chat with LLM while maintaining client context (important feature!)

        This ensures the LLM remembers this specific client's background
        and doesn't confuse different patients.

        Args:
            message: User's question or prompt
            client_context: Client's background information
            conversation_history: Previous messages in this session

        Returns:
            str: LLM response
        """
        system_prompt = f"""You are an expert therapist AI assistant. You are helping with a specific client.

IMPORTANT: Remember this client's context and never confuse them with other patients.

Client Profile:
{json.dumps(client_context, indent=2)}

Provide helpful, professional advice tailored to this specific client's situation.
Keep responses concise and actionable."""

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history if available
        if conversation_history:
            messages.extend(conversation_history)

        # Add current message
        messages.append({"role": "user", "content": message})

        response = await self._make_request(messages, temperature=0.7, max_tokens=1500)
        return response['choices'][0]['message']['content']

    # Helper methods for parsing structured responses

    def _parse_analysis_response(self, content: str) -> Dict[str, Any]:
        """Parse LLM analysis response into structured format"""
        # Simple parsing - in production, you'd want more robust parsing
        return {
            'raw_response': content,
            'summary': content[:500],  # First 500 chars as summary
            'key_points': [],  # Would parse bullet points
            'emotional_state': '',
            'progress_indicators': [],
            'recommendations': []
        }

    def _parse_agenda_response(self, content: str) -> Dict[str, Any]:
        """Parse LLM agenda response into structured format"""
        return {
            'raw_response': content,
            'agenda': [],
            'suggested_questions': [],
            'engagement_activities': [],
            'focus_areas': []
        }

    def _parse_session_log_response(self, content: str) -> Dict[str, Any]:
        """Parse LLM session log response into structured format"""
        return {
            'raw_response': content,
            'topics_discussed': [],
            'observations': '',
            'interventions_used': [],
            'homework_assigned': None,
            'next_session_focus': ''
        }


# Global LLM service instance
llm_service = TinfoilLLMService()

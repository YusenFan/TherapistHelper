"""
LLM Service using Tinfoil.sh API for confidential client data
"""
import httpx
from tinfoil import AsyncTinfoilAI
from app.core.config import settings
from typing import AsyncIterator, Dict, List, Optional, Any
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
        self._client = AsyncTinfoilAI(api_key=self.api_key)

    async def _make_request(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-oss-120b",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Make a non-streaming request to Tinfoil.sh API."""
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

    async def _make_streaming_request(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3-3-70b",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> AsyncIterator[str]:
        """Yield SSE-formatted token chunks using the Tinfoil SDK."""
        stream = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content is not None:
                token = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    async def _make_streaming_request(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama3-3-70b",
        temperature: float = 0.7,
        max_tokens: int = 2000
    ):
        """
        Make a streaming request to Tinfoil.sh API. Yields SSE-formatted chunks.
        """
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.api_endpoint}/chat/completions",
                headers=self.headers,
                json=payload
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            yield "data: [DONE]\n\n"
                            return
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0].get("delta", {})
                            token = delta.get("content", "")
                            if token:
                                yield f"data: {json.dumps({'token': token})}\n\n"
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

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

    async def analyze_client_intake(
        self,
        background: str,
        client_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze client background text and generate structured 8-field clinical intake assessment.
        """
        system_prompt = """You are an expert clinical psychologist. Based on the client background provided, generate a structured clinical intake assessment.

Return ONLY a valid JSON object with exactly these 18 fields:
{
  "identification": "...",
  "presenting_problem": "...",
  "psychiatric_history": "...",
  "trauma_history": "...",
  "family_psychiatric_history": "...",
  "medical_history": "...",
  "current_medications": "...",
  "substance_use": "...",
  "family_history": "...",
  "social_history": "...",
  "spiritual_cultural_factors": "...",
  "developmental_history": "...",
  "educational_vocational_history": "...",
  "legal_history": "...",
  "snap_strengths": "...",
  "snap_needs": "...",
  "snap_abilities": "...",
  "snap_preferences": "..."
}

Guidelines for each field:
- identification: Brief identifying summary — age, gender, referral source, presenting appearance
- presenting_problem: History of the present problem — main reasons for seeking therapy, onset, duration, severity, triggers
- psychiatric_history: Past psychiatric/psychological treatment, hospitalizations, previous diagnoses, medications tried
- trauma_history: History of trauma — abuse, neglect, accidents, violence, significant losses, PTSD symptoms
- family_psychiatric_history: Mental health history in family — diagnoses, substance use, suicide, hospitalizations among relatives
- medical_history: Current and past medical conditions, surgeries, chronic illnesses, relevant health concerns
- current_medications: All current medications including psychiatric, medical, supplements, dosages if known
- substance_use: Current and past use of alcohol, drugs, tobacco — frequency, quantity, history of dependence/treatment
- family_history: Family composition, dynamics, relationships, upbringing, current family support
- social_history: Social relationships, support network, living situation, daily activities, hobbies, isolation patterns
- spiritual_cultural_factors: Religious/spiritual beliefs, cultural background, how these influence coping and worldview
- developmental_history: Early development, childhood milestones, attachment patterns, significant childhood experiences
- educational_vocational_history: Education level, academic performance, work history, current employment, career concerns
- legal_history: Any legal involvement — arrests, custody issues, restraining orders, pending cases
- snap_strengths: Client strengths — resilience, insight, motivation, coping skills, values, accomplishments
- snap_needs: Client needs — areas requiring support, unmet needs, treatment priorities
- snap_abilities: Client abilities — functional capacities, skills, competencies, resources available
- snap_preferences: Client preferences — preferred treatment approach, goals, what they want from therapy

IMPORTANT: If the background does not mention information for a particular field, return an empty string "" for that field. Do NOT fabricate or assume information not provided. Only populate fields where the background clearly provides relevant information.

Be professional and evidence-based."""

        user_content = ""
        if client_info:
            user_content += f"Client Info: {json.dumps(client_info)}\n\n"
        user_content += f"Client Background:\n{background}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        response = await self._make_request(messages, temperature=0.5, max_tokens=4000)
        content = response['choices'][0]['message']['content']

        import re
        try:
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        # Fallback: put raw content in presenting_problem
        return {
            "identification": "",
            "presenting_problem": content,
            "psychiatric_history": "",
            "trauma_history": "",
            "family_psychiatric_history": "",
            "medical_history": "",
            "current_medications": "",
            "substance_use": "",
            "family_history": "",
            "social_history": "",
            "spiritual_cultural_factors": "",
            "developmental_history": "",
            "educational_vocational_history": "",
            "legal_history": "",
            "snap_strengths": "",
            "snap_needs": "",
            "snap_abilities": "",
            "snap_preferences": "",
        }

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

    async def convert_note_format(
        self,
        free_text: str,
        target_format: str
    ) -> Dict[str, Any]:
        """
        Convert free-text session notes into a structured clinical format.

        Args:
            free_text: Therapist's raw session notes
            target_format: 'BIRP', 'DAP', or 'SOAP'

        Returns:
            dict: Structured fields for the requested format
        """
        format_schemas = {
            'BIRP': '''{
  "behavior": "Client presentation, mood, affect, reported events this week",
  "intervention": "Therapeutic techniques and interventions used",
  "response": "How the client responded to interventions, engagement, insight",
  "plan": "Next steps, goals for next session, referrals, treatment plan changes"
}''',
            'DAP': '''{
  "data": "Objective and subjective information: what the client reported, observed behaviours",
  "assessment": "Clinical interpretation, progress toward goals, clinical impressions",
  "plan": "Next steps, homework, referrals, treatment plan changes"
}''',
            'SOAP': '''{
  "subjective": "Client's own report: what they said, felt, or presented verbally",
  "objective": "Observable data: appearance, psychomotor behaviour, affect, test scores",
  "assessment": "Clinical interpretation: progress, diagnosis considerations, formulation",
  "plan": "Next steps, medications, homework, referrals, next session focus"
}''',
        }

        schema = format_schemas.get(target_format, format_schemas['BIRP'])

        system_prompt = f"""You are an expert clinical therapist. Convert the provided session notes into a structured {target_format} clinical note.

Return ONLY a valid JSON object matching this schema:
{schema}

Be professional and clinically precise. Preserve all clinical details from the original notes."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Convert these session notes to {target_format} format:\n\n{free_text}"},
        ]

        response = await self._make_request(messages, temperature=0.3, max_tokens=1500)
        content = response['choices'][0]['message']['content']

        try:
            json_match = __import__('re').search(r'\{[\s\S]*\}', content)
            if json_match:
                return json.loads(json_match.group())
        except (json.JSONDecodeError, AttributeError):
            pass

        return {}

    async def generate_client_persona(
        self,
        client_info: Dict[str, Any],
        session_summaries: Optional[List[str]] = None
    ) -> str:
        """
        Generate a 400-600 word clinical persona for a client.
        Used on client creation and updated after sessions.
        """
        system_prompt = """You are an expert clinical psychologist. Write a 400-600 word clinical persona for this client covering:
- Attachment style and relational patterns
- Defense mechanisms and coping strategies
- Core themes and recurring concerns
- Emotional regulation patterns
- Strengths and resilience factors
- Areas for therapeutic focus

Be professional, evidence-based, and clinically insightful. Write in third person."""

        user_content = f"Client Information: {json.dumps(client_info)}"
        if session_summaries:
            user_content += "\n\nSession History:\n" + "\n\n".join(session_summaries)
        user_content += "\n\nGenerate a clinical persona for this client."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        response = await self._make_request(messages, temperature=0.6, max_tokens=1000)
        return response['choices'][0]['message']['content']

    def _build_client_profile_block(self, client_info: Dict[str, Any], persona: Optional[str], session_summaries: Optional[List[str]] = None) -> str:
        """Build a reusable client profile + session history block for system prompts."""
        name = client_info.get("name", "the client")
        preferred = client_info.get("preferred_name")
        age = client_info.get("approximate_age", "unknown age")
        gender = client_info.get("gender_identity", "")
        pronouns = client_info.get("pronouns", "")
        background = client_info.get("background_summary", "")

        lines = [
            "Client Profile:",
            f"- Name: {name}" + (f" (goes by {preferred})" if preferred else ""),
            f"- Age: {age}",
        ]
        if gender:
            lines.append(f"- Gender Identity: {gender}")
        if pronouns:
            lines.append(f"- Pronouns: {pronouns}")
        if background:
            lines.append(f"- Background: {background}")

        block = "\n".join(lines)

        if persona:
            block += f"\n\nClinical Persona:\n{persona}"

        if session_summaries:
            block += "\n\nSession History (most recent first):\n" + "\n\n".join(session_summaries)

        return block

    async def chat_with_client_mode(
        self,
        mode: str,
        client_info: Dict[str, Any],
        persona: Optional[str],
        messages: List[Dict[str, str]],
        session_summaries: Optional[List[str]] = None
    ) -> str:
        """
        Chat with LLM in a client-focused mode.
        Modes: investigate, role_play, supervisor
        """
        profile = self._build_client_profile_block(client_info, persona, session_summaries)
        name = client_info.get("name", "the client")

        if mode == "investigate":
            system_prompt = f"""You are an expert clinical psychologist helping a therapist investigate their client.

{profile}

Provide thoughtful clinical insights, explore patterns, and help the therapist understand this client more deeply. Be analytical and evidence-based."""

        elif mode == "role_play":
            system_prompt = f"""You are {name}, a client in therapy. Stay in character at all times.

{profile}

Respond naturally as this client would in a therapy session. Show realistic emotions, defenses, and communication patterns consistent with the client's background and session history. Do not break character."""

        elif mode == "supervisor":
            system_prompt = f"""You are an experienced clinical supervisor helping a therapist reflect on their work with a client.

{profile}

Provide clinical supervision: help the therapist process challenges, consider alternative formulations, explore countertransference, and develop their clinical thinking."""

        else:
            system_prompt = f"You are a helpful clinical AI assistant.\n\n{profile}"

        full_messages = [{"role": "system", "content": system_prompt}]
        full_messages.extend(messages)

        response = await self._make_request(full_messages, temperature=0.7, max_tokens=1500)
        return response['choices'][0]['message']['content']

    async def stream_chat_with_client_mode(
        self,
        mode: str,
        client_info: Dict[str, Any],
        persona: Optional[str],
        messages: List[Dict[str, str]],
        session_summaries: Optional[List[str]] = None
    ) -> AsyncIterator[str]:
        """Streaming version of chat_with_client_mode. Yields SSE chunks."""
        profile = self._build_client_profile_block(client_info, persona, session_summaries)
        name = client_info.get("name", "the client")

        if mode == "investigate":
            system_prompt = f"""You are an expert clinical psychologist helping a therapist investigate their client.

{profile}

Provide thoughtful clinical insights, explore patterns, and help the therapist understand this client more deeply. Be analytical and evidence-based."""
        elif mode == "role_play":
            system_prompt = f"""You are {name}, a client in therapy. Stay in character at all times.

{profile}

Respond naturally as this client would in a therapy session. Show realistic emotions, defenses, and communication patterns consistent with the client's background and session history. Do not break character."""
        elif mode == "supervisor":
            system_prompt = f"""You are an experienced clinical supervisor helping a therapist reflect on their work with a client.

{profile}

Provide clinical supervision: help the therapist process challenges, consider alternative formulations, explore countertransference, and develop their clinical thinking."""
        else:
            system_prompt = f"You are a helpful clinical AI assistant.\n\n{profile}"

        full_messages = [{"role": "system", "content": system_prompt}]
        full_messages.extend(messages)

        async for chunk in self._make_streaming_request(full_messages, temperature=0.7, max_tokens=1500):
            yield chunk

    _SCHOOL_DESCRIPTIONS = {
        "CBT": "Cognitive Behavioral Therapy — focuses on the relationship between thoughts, feelings, and behaviors",
        "Psychoanalytic": "Psychoanalytic therapy — explores unconscious processes, early experiences, and defense mechanisms",
        "Humanistic": "Humanistic therapy — emphasizes personal growth, self-actualization, and unconditional positive regard",
        "Existential": "Existential therapy — addresses meaning, freedom, responsibility, and existential anxiety",
        "Gestalt": "Gestalt therapy — focuses on present-moment awareness, contact, and unfinished business",
        "ACT": "Acceptance and Commitment Therapy — uses acceptance, mindfulness, and values-based action",
        "DBT": "Dialectical Behavior Therapy — combines CBT with mindfulness and dialectical thinking",
        "Narrative": "Narrative therapy — helps clients re-author their life stories and separate from problems",
        "SFBT": "Solution-Focused Brief Therapy — focuses on strengths, solutions, and a preferred future",
        "Adlerian": "Adlerian therapy — explores social interest, birth order, lifestyle, and inferiority feelings",
        "Behavioral": "Behavioral therapy — uses learning principles to change maladaptive behaviors",
        "IPT": "Interpersonal Therapy — focuses on improving interpersonal relationships and communication",
    }

    def _build_school_system_prompt(
        self,
        school: str,
        client_info: Optional[Dict[str, Any]] = None,
        session_summaries: Optional[List[str]] = None
    ) -> str:
        description = self._SCHOOL_DESCRIPTIONS.get(school, school)
        prompt = f"""You are an expert in {school} therapy. {description}

Draw from the core theories, techniques, and language of {school} to respond to clinical questions.
Suggest specific interventions, exercises, or frameworks from this approach where relevant."""

        if client_info:
            profile = self._build_client_profile_block(client_info, None, session_summaries)
            prompt += f"\n\n{profile}"
        elif session_summaries:
            prompt += "\n\nSession History:\n" + "\n\n".join(session_summaries)

        return prompt

    async def stream_chat_psychological_school(
        self,
        school: str,
        messages: List[Dict[str, str]],
        client_info: Optional[Dict[str, Any]] = None,
        session_summaries: Optional[List[str]] = None
    ) -> AsyncIterator[str]:
        """Streaming version of chat_psychological_school. Yields SSE chunks."""
        system_prompt = self._build_school_system_prompt(school, client_info, session_summaries)

        full_messages = [{"role": "system", "content": system_prompt}]
        full_messages.extend(messages)

        async for chunk in self._make_streaming_request(full_messages, temperature=0.7, max_tokens=1500):
            yield chunk

    async def chat_psychological_school(
        self,
        school: str,
        messages: List[Dict[str, str]],
        client_info: Optional[Dict[str, Any]] = None,
        session_summaries: Optional[List[str]] = None
    ) -> str:
        """Chat from the perspective of a psychological therapeutic school."""
        system_prompt = self._build_school_system_prompt(school, client_info, session_summaries)

        full_messages = [{"role": "system", "content": system_prompt}]
        full_messages.extend(messages)

        response = await self._make_request(full_messages, temperature=0.7, max_tokens=1500)
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

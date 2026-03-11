const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ClientListItem {
  id: string
  full_name: string
  age: number
  gender: string
  created_at: string
  status?: string
}

export interface ClientDetail extends ClientListItem {
  email_encrypted?: string
  phone_encrypted?: string
  address_encrypted?: string
  emergency_contact_encrypted?: string
  occupation?: string
  custom_gender?: string
  tags?: string[]
  diagnosis?: string
  medications?: string
  notes?: string
  background?: string
  updated_at?: string
}

export interface ClientData {
  full_name: string
  age: number
  gender: string
  custom_gender?: string
  background?: string
  notes?: string
  occupation?: string
  email?: string
  phone?: string
  status?: string
}

export interface IntakeAnalysis {
  presenting_problem: string
  clinical_symptoms: string
  diagnosis: string
  case_formulation: string
  risk_level: string
  functioning_severity: string
  personality_patterns: string
  strengths_resources: string
}

export interface ClientPresentation {
  mood_rating?: number | null   // 1–10
  affect?: string               // e.g. "appropriate", "flat", "labile"
  tags?: string[]               // presenting themes / issues
  notes?: string
}

export interface RiskAssessment {
  risk_level?: string           // "none" | "low" | "moderate" | "high" | "imminent"
  suicidal_ideation?: string    // "none" | "passive" | "active_without_plan" | "active_with_plan"
  self_harm?: boolean
  homicidal_ideation?: boolean
  protective_factors?: string[]
  notes?: string
}

export interface HomeworkItem {
  task: string
  completed: boolean
}

export interface Homework {
  items?: HomeworkItem[]
  notes?: string
}

export interface Planning {
  goals?: string[]
  interventions?: string[]
  next_session_focus?: string
  notes?: string
}

export interface Session {
  id: string
  client_id: string
  session_date: string
  duration_minutes: number
  session_type: string
  notes?: string
  transcript?: string
  summary?: string
  analysis?: Record<string, unknown>
  client_presentation?: ClientPresentation
  risk_assessment?: RiskAssessment
  homework?: Homework
  planning?: Planning
  private_notes?: string
  tags?: string[]
  created_at: string
  updated_at?: string
}

export interface Note {
  id: string
  client_id: string
  content: string
  created_at: string
  updated_at?: string
}

export interface ChatMessage {
  role: string
  content: string
}

export interface ChatResponse {
  reply: string
  mode?: string
  school?: string
}

// Alias used by client detail page
export type ClientResponse = ClientDetail

export interface Attendance {
  id: string
  client_id: string
  session_id: string
  attended: boolean
  cancellation_reason?: string
  note?: string
  created_at: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const makeRequest = async (authToken: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      return fetch(url, {
        ...options,
        headers,
      })
    }

    let response = await makeRequest(token)

    // If we get a 401, try to refresh the JWT token
    if (response.status === 401 && typeof window !== 'undefined') {
      try {
        const { account } = await import('./appwrite')
        const jwt = await account.createJWT()
        token = jwt.jwt
        localStorage.setItem('token', token)

        // Retry the request with the new token
        response = await makeRequest(token)
      } catch (err) {
        console.error('Failed to refresh JWT:', err)
        // If refresh fails, remove the token and let the request fail
        localStorage.removeItem('token')
      }
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Clients
  async getClients(): Promise<ClientListItem[]> {
    return this.request<ClientListItem[]>('/api/v1/clients/')
  }

  async getClientsCount(): Promise<{ total_clients: number }> {
    return this.request<{ total_clients: number }>('/api/v1/clients/stats/count')
  }

  async getSessionStats(): Promise<{ total_hours: number }> {
    return this.request<{ total_hours: number }>('/api/v1/sessions/stats/totals')
  }

  async getClient(id: string): Promise<ClientDetail> {
    return this.request<ClientDetail>(`/api/v1/clients/${id}`)
  }

  async createClient(data: ClientData | Partial<ClientDetail>): Promise<ClientDetail> {
    return this.request<ClientDetail>('/api/v1/clients/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async analyzeIntake(data: { background: string; name?: string; age?: number; gender?: string }): Promise<IntakeAnalysis> {
    return this.request<IntakeAnalysis>('/api/v1/ai/intake-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async convertNoteFormat(
    freeText: string,
    targetFormat: 'BIRP' | 'DAP' | 'SOAP'
  ): Promise<{
    behavior?: string; intervention?: string; response?: string;
    data?: string; subjective?: string; objective?: string;
    assessment?: string; plan?: string;
  }> {
    return this.request('/api/v1/ai/convert-notes', {
      method: 'POST',
      body: JSON.stringify({ free_text: freeText, target_format: targetFormat }),
    })
  }

  async speechToText(audioBlob: Blob, filename = 'recording.webm'): Promise<string> {
    const url = `${this.baseUrl}/api/v1/ai/speech-to-text`
    const formData = new FormData()
    formData.append('file', audioBlob, filename)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const response = await fetch(url, { method: 'POST', headers, body: formData })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }
    const result = await response.json()
    return result.text as string
  }

  async updateClient(id: string, data: Partial<ClientDetail>): Promise<ClientDetail> {
    return this.request<ClientDetail>(`/api/v1/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string): Promise<void> {
    return this.request<void>(`/api/v1/clients/${id}`, {
      method: 'DELETE',
    })
  }

  // Chat
  async clientChat(
    clientId: string,
    mode: string,
    messages: ChatMessage[],
    sessionIds?: string[]
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v1/ai/chat/client', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        mode,
        messages,
        session_ids: sessionIds,
      }),
    })
  }

  async schoolChat(
    school: string,
    messages: ChatMessage[],
    clientContext?: string,
    sessionIds?: string[]
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v1/ai/chat/school', {
      method: 'POST',
      body: JSON.stringify({
        school,
        messages,
        client_context: clientContext,
        session_ids: sessionIds,
      }),
    })
  }

  async *streamClientChat(
    clientId: string,
    mode: string,
    messages: ChatMessage[],
    sessionIds?: string[]
  ): AsyncGenerator<string> {
    const url = `${this.baseUrl}/api/v1/ai/chat/client/stream`
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ client_id: clientId, mode, messages, session_ids: sessionIds }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    yield* this._consumeSSE(response)
  }

  async *streamSchoolChat(
    school: string,
    messages: ChatMessage[],
    clientContext?: string,
    sessionIds?: string[]
  ): AsyncGenerator<string> {
    const url = `${this.baseUrl}/api/v1/ai/chat/school/stream`
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ school, messages, client_context: clientContext, session_ids: sessionIds }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    yield* this._consumeSSE(response)
  }

  private async *_consumeSSE(response: Response): AsyncGenerator<string> {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.token) yield parsed.token
        } catch { /* skip malformed lines */ }
      }
    }
  }

  async getClientSessions(clientId: string): Promise<Session[]> {
    const all = await this.request<Session[]>('/api/v1/sessions/')
    return all.filter(s => s.client_id === clientId)
  }

  // Sessions
  async getLatestClientSession(clientId: string): Promise<Session | null> {
    try {
      return await this.request<Session>(`/api/v1/sessions/client/${clientId}/latest`)
    } catch {
      return null
    }
  }

  async getSessions(clientId?: string): Promise<Session[]> {
    const endpoint = clientId
      ? `/api/v1/clients/${clientId}/sessions/`
      : '/api/v1/sessions/'
    return this.request<Session[]>(endpoint)
  }

  async getSession(id: string): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${id}`)
  }

  async createSession(data: Partial<Session> & {
    client_id: string
    session_date: string
    duration_minutes: number
    session_type: string
  }): Promise<Session> {
    return this.request<Session>('/api/v1/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSession(id: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${id}`, {
      method: 'DELETE',
    })
  }

  // Transcription
  async uploadTranscription(file: File, clientId: string): Promise<{ transcript: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', clientId)

    const url = `${this.baseUrl}/api/v1/transcribe/`
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // AI Insights
  async getAIInsights(sessionId: string): Promise<{ insights: string }> {
    return this.request<{ insights: string }>(`/api/v1/sessions/${sessionId}/ai-insights/`)
  }

  // Notes
  async getNotes(clientId: string): Promise<Note[]> {
    return this.request<Note[]>(`/api/v1/clients/${clientId}/notes/`)
  }

  async createNote(clientId: string, content: string): Promise<Note> {
    return this.request<Note>(`/api/v1/clients/${clientId}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async updateNote(id: string, content: string): Promise<Note> {
    return this.request<Note>(`/api/v1/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  }

  async deleteNote(id: string): Promise<void> {
    return this.request<void>(`/api/v1/notes/${id}`, {
      method: 'DELETE',
    })
  }

  // Attendance
  async getAttendance(clientId: string): Promise<Attendance[]> {
    return this.request<Attendance[]>(`/api/v1/clients/${clientId}/attendance/`)
  }

  async markAttendance(sessionId: string, attended: boolean, note?: string): Promise<Attendance> {
    return this.request<Attendance>('/api/v1/attendance/', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, attended, note }),
    })
  }
}

export const apiClient = new ApiClient()

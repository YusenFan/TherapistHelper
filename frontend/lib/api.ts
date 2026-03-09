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
  tags?: string[]
  diagnosis?: string
  medications?: string
  notes?: string
  updated_at?: string
}

export interface Session {
  id: string
  client_id: string
  session_date: string
  duration_minutes: number
  session_type: string
  notes?: string
  transcript_path?: string
  ai_insights?: string
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

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

  async getClient(id: string): Promise<ClientDetail> {
    return this.request<ClientDetail>(`/api/v1/clients/${id}/`)
  }

  async createClient(data: Partial<ClientDetail>): Promise<ClientDetail> {
    return this.request<ClientDetail>('/api/v1/clients/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateClient(id: string, data: Partial<ClientDetail>): Promise<ClientDetail> {
    return this.request<ClientDetail>(`/api/v1/clients/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string): Promise<void> {
    return this.request<void>(`/api/v1/clients/${id}/`, {
      method: 'DELETE',
    })
  }

  // Sessions
  async getSessions(clientId?: string): Promise<Session[]> {
    const endpoint = clientId
      ? `/api/v1/clients/${clientId}/sessions/`
      : '/api/v1/sessions/'
    return this.request<Session[]>(endpoint)
  }

  async getSession(id: string): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${id}/`)
  }

  async createSession(data: Partial<Session>): Promise<Session> {
    return this.request<Session>('/api/v1/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSession(id: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${id}/`, {
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
    return this.request<Note>(`/api/v1/notes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  }

  async deleteNote(id: string): Promise<void> {
    return this.request<void>(`/api/v1/notes/${id}/`, {
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

'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient, type ChatMessage, type Session } from '@/lib/api'

interface ClientChatProps {
  clientId: string
}

type ChatMode = 'investigate' | 'role_play' | 'supervisor' | 'schools'
type PsychSchool = 'CBT' | 'Psychoanalytic' | 'Humanistic' | 'Existential' | 'Gestalt' | 'ACT' | 'DBT' | 'Narrative' | 'SFBT' | 'Adlerian' | 'Behavioral' | 'IPT'

const PSYCH_SCHOOLS: PsychSchool[] = [
  'CBT', 'Psychoanalytic', 'Humanistic', 'Existential',
  'Gestalt', 'ACT', 'DBT', 'Narrative', 'SFBT', 'Adlerian', 'Behavioral', 'IPT'
]

const MODE_TABS: { id: ChatMode; label: string; desc: string }[] = [
  { id: 'investigate', label: 'Investigate', desc: 'Clinical insights' },
  { id: 'role_play', label: 'Role Play', desc: 'Simulate client' },
  { id: 'supervisor', label: 'Supervisor', desc: 'Clinical supervision' },
  { id: 'schools', label: 'Psych Schools', desc: 'Theoretical lens' },
]

export default function ClientChat({ clientId }: ClientChatProps) {
  const [mode, setMode] = useState<ChatMode>('investigate')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedSchool, setSelectedSchool] = useState<PsychSchool>('CBT')
  const [clientContext, setClientContext] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode)
    setMessages([])
    setInputText('')
  }

  useEffect(() => {
    if (mode === 'supervisor') {
      apiClient.getClientSessions(clientId).then(setSessions).catch(() => setSessions([]))
    }
  }, [mode, clientId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: inputText.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputText('')
    setIsLoading(true)

    try {
      let reply: string
      if (mode === 'schools') {
        const result = await apiClient.schoolChat(selectedSchool, newMessages, clientContext || undefined)
        reply = result.reply
      } else {
        const result = await apiClient.clientChat(
          clientId,
          mode,
          newMessages,
          mode === 'supervisor' ? selectedSessions : undefined
        )
        reply = result.reply
      }
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleSession = (id: string) => {
    setSelectedSessions(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col h-[640px] bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Mode Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleModeChange(tab.id)}
            className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              mode === tab.id
                ? 'border-therapy-coral text-therapy-coral'
                : 'border-transparent text-gray-500 hover:text-therapy-navy'
            }`}
          >
            <div className="font-medium truncate">{tab.label}</div>
            <div className="text-xs opacity-60 hidden sm:block truncate">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Supervisor: session selector */}
      {mode === 'supervisor' && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-sm font-medium text-therapy-navy mb-2">Session context (optional):</p>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No sessions found</p>
          ) : (
            <div className="space-y-2 max-h-28 overflow-y-auto">
              {sessions.map((session) => (
                <label key={session.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => toggleSession(session.id)}
                    className="h-4 w-4 text-therapy-coral rounded border-gray-300"
                  />
                  <span className="text-sm text-therapy-navy">
                    {new Date(session.session_date).toLocaleDateString()} — {session.session_type}
                    {session.summary ? ' (has summary)' : ''}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Psych Schools: school + optional context */}
      {mode === 'schools' && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-therapy-navy mb-1">Framework</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value as PsychSchool)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
            >
              {PSYCH_SCHOOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-therapy-navy mb-1">Client context (optional)</label>
            <input
              type="text"
              value={clientContext}
              onChange={(e) => setClientContext(e.target.value)}
              placeholder="Brief context..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">
              Start a conversation in <span className="font-medium">{MODE_TABS.find(t => t.id === mode)?.label}</span> mode
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-therapy-coral text-white'
                : 'bg-gray-100 text-therapy-navy'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex space-x-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

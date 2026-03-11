'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-snug">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
        code: ({ children }) => <code className="bg-black/10 px-1 rounded text-xs font-mono">{children}</code>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-current pl-2 opacity-80 my-1">{children}</blockquote>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function SessionDropdown({ label, sessions, value, onChange, excluded }: {
  label: string
  sessions: Session[]
  value: string
  onChange: (id: string) => void
  excluded?: string
}) {
  const available = sessions.filter(s => s.id !== excluded)
  return (
    <div>
      <label className="block text-xs font-medium text-therapy-navy mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
      >
        <option value="">None</option>
        {available.map((s) => (
          <option key={s.id} value={s.id}>
            {new Date(s.session_date).toLocaleDateString()} — {s.session_type}{s.summary ? ' ✓' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ClientChat({ clientId }: ClientChatProps) {
  const [mode, setMode] = useState<ChatMode>('investigate')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedSchool, setSelectedSchool] = useState<PsychSchool>('CBT')
  const [sessions, setSessions] = useState<Session[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode)
    setMessages([])
    setInputText('')
    setStreamingContent('')
    setSelectedSessions([])
  }

  useEffect(() => {
    if (mode === 'supervisor' || mode === 'schools') {
      apiClient.getClientSessions(clientId).then(setSessions).catch(() => setSessions([]))
    }
  }, [mode, clientId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingContent])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: inputText.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputText('')
    setIsLoading(true)
    setStreamingContent('')

    try {
      let accumulated = ''

      if (mode === 'schools') {
        const stream = apiClient.streamSchoolChat(
          selectedSchool,
          newMessages,
          undefined,
          selectedSessions.length > 0 ? selectedSessions : undefined
        )
        for await (const token of stream) {
          accumulated += token
          setStreamingContent(accumulated)
        }
      } else {
        const stream = apiClient.streamClientChat(
          clientId,
          mode,
          newMessages,
          mode === 'supervisor' ? selectedSessions : undefined
        )
        for await (const token of stream) {
          accumulated += token
          setStreamingContent(accumulated)
        }
      }

      setMessages([...newMessages, { role: 'assistant', content: accumulated }])
      setStreamingContent('')
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again.'
      }])
      setStreamingContent('')
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

  return (
    <div className="flex flex-col h-[820px] bg-white rounded-xl shadow-sm border border-gray-200">
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

      {/* Supervisor: session dropdowns */}
      {mode === 'supervisor' && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex gap-3">
          <SessionDropdown
            label="Session 1"
            sessions={sessions}
            value={selectedSessions[0] ?? ''}
            onChange={(id) => setSelectedSessions(prev => id ? [id, prev[1] ?? ''].filter(Boolean) : [prev[1] ?? ''].filter(Boolean))}
            excluded={selectedSessions[1]}
          />
          <SessionDropdown
            label="Session 2"
            sessions={sessions}
            value={selectedSessions[1] ?? ''}
            onChange={(id) => setSelectedSessions(prev => id ? [prev[0] ?? '', id].filter(Boolean) : [prev[0] ?? ''].filter(Boolean))}
            excluded={selectedSessions[0]}
          />
        </div>
      )}

      {/* Psych Schools: framework + session dropdowns */}
      {mode === 'schools' && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-therapy-navy mb-1">Framework</label>
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
          <SessionDropdown
            label="Session 1"
            sessions={sessions}
            value={selectedSessions[0] ?? ''}
            onChange={(id) => setSelectedSessions(prev => id ? [id, prev[1] ?? ''].filter(Boolean) : [prev[1] ?? ''].filter(Boolean))}
            excluded={selectedSessions[1]}
          />
          <SessionDropdown
            label="Session 2"
            sessions={sessions}
            value={selectedSessions[1] ?? ''}
            onChange={(id) => setSelectedSessions(prev => id ? [prev[0] ?? '', id].filter(Boolean) : [prev[0] ?? ''].filter(Boolean))}
            excluded={selectedSessions[0]}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !streamingContent && (
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
              {msg.role === 'assistant'
                ? <MarkdownMessage content={msg.content} />
                : <p className="whitespace-pre-wrap">{msg.content}</p>
              }
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-gray-100 text-therapy-navy">
              <MarkdownMessage content={streamingContent} />
              <span className="inline-block w-1.5 h-3.5 bg-therapy-coral ml-0.5 animate-pulse rounded-sm" />
            </div>
          </div>
        )}

        {/* Thinking dots (before first token) */}
        {isLoading && !streamingContent && (
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
        <p className="text-xs text-gray-400 mt-2 text-center">
          All conversations are confidential and will not be used for model training or shared with third parties.
        </p>
      </div>
    </div>
  )
}

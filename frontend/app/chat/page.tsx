'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { apiClient, type ChatMessage } from '@/lib/api'

type PsychSchool = 'CBT' | 'Psychoanalytic' | 'Humanistic' | 'Existential' | 'Gestalt' | 'ACT' | 'DBT' | 'Narrative' | 'SFBT' | 'Adlerian' | 'Behavioral' | 'IPT'

const PSYCH_SCHOOLS: { id: PsychSchool; description: string }[] = [
  { id: 'CBT', description: 'Cognitive Behavioral Therapy' },
  { id: 'DBT', description: 'Dialectical Behavior Therapy' },
  { id: 'ACT', description: 'Acceptance & Commitment Therapy' },
  { id: 'Psychoanalytic', description: 'Psychoanalytic Therapy' },
  { id: 'Humanistic', description: 'Humanistic Therapy' },
  { id: 'Existential', description: 'Existential Therapy' },
  { id: 'Gestalt', description: 'Gestalt Therapy' },
  { id: 'Narrative', description: 'Narrative Therapy' },
  { id: 'SFBT', description: 'Solution-Focused Brief Therapy' },
  { id: 'Adlerian', description: 'Adlerian Therapy' },
  { id: 'Behavioral', description: 'Behavioral Therapy' },
  { id: 'IPT', description: 'Interpersonal Therapy' },
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

export default function ChatPage() {
  const [selectedSchool, setSelectedSchool] = useState<PsychSchool | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [clientContext, setClientContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingContent])

  const handleSchoolSelect = (school: PsychSchool) => {
    setSelectedSchool(school)
    setMessages([])
    setInputText('')
    setStreamingContent('')
  }

  const handleSend = async () => {
    if (!inputText.trim() || !selectedSchool || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: inputText.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputText('')
    setIsLoading(true)
    setStreamingContent('')

    try {
      let accumulated = ''
      const stream = apiClient.streamSchoolChat(selectedSchool, newMessages, clientContext || undefined)
      for await (const token of stream) {
        accumulated += token
        setStreamingContent(accumulated)
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-therapy-navy">Psychological Schools Chat</h1>
        <p className="text-gray-600 mt-2">Consult with AI through different therapeutic theoretical frameworks</p>
      </div>

      {!selectedSchool ? (
        <div>
          <h2 className="text-lg font-semibold text-therapy-navy mb-4">Select a Theoretical Framework</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PSYCH_SCHOOLS.map((school) => (
              <button
                key={school.id}
                onClick={() => handleSchoolSelect(school.id)}
                className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-therapy-coral hover:shadow-md transition-all text-left group"
              >
                <div className="font-semibold text-therapy-navy group-hover:text-therapy-coral transition-colors">
                  {school.id}
                </div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">{school.description}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-therapy-navy">{selectedSchool}</h2>
              <p className="text-sm text-gray-500">
                {PSYCH_SCHOOLS.find(s => s.id === selectedSchool)?.description}
              </p>
            </div>
            <button
              onClick={() => { setSelectedSchool(null); setMessages([]); setStreamingContent('') }}
              className="text-sm text-therapy-coral hover:underline transition-colors"
            >
              ← Change Framework
            </button>
          </div>

          {/* Optional client context */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <label className="block text-sm font-medium text-therapy-navy mb-2">
              Client Context <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={clientContext}
              onChange={(e) => setClientContext(e.target.value)}
              placeholder="Paste brief client background, presenting issues, or session notes to give the AI context…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none"
            />
          </div>

          {/* Chat interface */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200" style={{ height: '660px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 && !streamingContent && (
                <div className="text-center text-gray-400 py-8">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">
                    Ask about <span className="font-medium">{selectedSchool}</span> therapy approaches, techniques, or case applications
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
                  placeholder={`Ask about ${selectedSchool} therapy…`}
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
        </div>
      )}
    </div>
  )
}

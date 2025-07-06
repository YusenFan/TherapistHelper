'use client'
import { useState } from 'react'

interface HelperPanelProps {
  suggestedQuestions: string[]
}

export default function HelperPanel({ suggestedQuestions }: HelperPanelProps) {
  const [notes, setNotes] = useState('')

  return (
    <div className="h-full space-y-6">
      {/* Suggested Questions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-therapy-green bg-opacity-30 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-therapy-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-therapy-navy">Suggested Questions for Next Session</h4>
        </div>
        <ul className="space-y-4">
          {suggestedQuestions.map((question, index) => (
            <li key={index} className="group">
              <div className="p-4 bg-therapy-green bg-opacity-10 rounded-lg border border-therapy-green border-opacity-30 hover:bg-opacity-20 transition-colors cursor-pointer">
                <p className="text-therapy-navy text-sm leading-relaxed">{question}</p>
                <div className="flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs text-therapy-coral hover:text-therapy-coral font-medium">
                    Copy to clipboard
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Therapist's Private Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-therapy-blue bg-opacity-30 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-therapy-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-therapy-navy">Therapist's Private Notes</h4>
        </div>
        <div className="h-64">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your private notes about this session..."
            className="w-full h-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-therapy-blue focus:border-transparent outline-none text-therapy-navy placeholder-gray-500"
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500">
            {notes.length}/500 characters
          </span>
          <button className="px-4 py-2 bg-therapy-blue text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium">
            Save Notes
          </button>
        </div>
      </div>
    </div>
  )
} 
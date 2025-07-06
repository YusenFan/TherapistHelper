import Header from '@/components/Header'
import TranscriptPanel from '@/components/session-analysis/TranscriptPanel'
import SummaryPanel from '@/components/session-analysis/SummaryPanel'
import HelperPanel from '@/components/session-analysis/HelperPanel'

// Mock data for demonstration
const mockSessionData = {
  client: {
    name: "John Doe",
    sessionDate: "July 5, 2025"
  },
  transcript: [
    {
      speaker: "Therapist",
      text: "Good morning, John. How are you feeling today?",
      timestamp: "00:00:12"
    },
    {
      speaker: "John",
      text: "I've been having a tough week. Work has been really stressful, and I feel like I'm not handling it well.",
      timestamp: "00:00:18"
    },
    {
      speaker: "Therapist", 
      text: "I hear that work stress is affecting you. Can you tell me more about what specifically is causing you stress?",
      timestamp: "00:00:35"
    },
    {
      speaker: "John",
      text: "My manager keeps piling on more projects, and I feel like I can't say no. It's affecting my relationship with my family too. I come home exhausted and irritable.",
      timestamp: "00:00:42"
    },
    {
      speaker: "Therapist",
      text: "It sounds like the work stress is spilling over into your family life. How is your family responding to this?",
      timestamp: "00:01:05"
    },
    {
      speaker: "John",
      text: "My wife has been understanding, but I can see she's getting frustrated. We barely spend quality time together anymore. And my kids... I feel like I'm missing out on their lives.",
      timestamp: "00:01:12"
    }
  ],
  aiSummary: "John is experiencing significant work-related stress that is negatively impacting his family relationships. He feels overwhelmed by his workload and struggles with setting boundaries with his manager. The stress is manifesting as irritability at home and reduced quality time with his family members.",
  keyThemes: [
    "Work Stress",
    "Family Relationships", 
    "Boundary Setting",
    "Work-Life Balance"
  ],
  actionableInsights: [
    "Explore boundary-setting techniques with manager",
    "Develop stress management strategies for work environment",
    "Discuss family communication strategies",
    "Address feelings of guilt about missing family time"
  ],
  suggestedQuestions: [
    "What would setting a healthy boundary with your manager look like to you?",
    "How might we create more intentional family time despite your busy schedule?",
    "What are some stress management techniques you've tried in the past?",
    "How can we help your family understand what you're going through?"
  ]
}

export default function SessionAnalysis() {
  return (
    <div className="min-h-screen bg-therapy-gray">
      <Header />
      
      {/* Client Sub-Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-therapy-navy">
                {mockSessionData.client.name}
              </h2>
              <p className="text-gray-600 mt-1">
                Session: {mockSessionData.client.sessionDate}
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                Export Report
              </button>
              <button className="px-4 py-2 border border-therapy-blue text-therapy-navy rounded-lg hover:bg-therapy-blue hover:bg-opacity-10 transition-colors font-medium">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column - Transcript */}
          <div className="lg:col-span-1">
            <TranscriptPanel transcript={mockSessionData.transcript} />
          </div>

          {/* Center Column - AI Summary & Insights */}
          <div className="lg:col-span-1">
            <SummaryPanel 
              summary={mockSessionData.aiSummary}
              keyThemes={mockSessionData.keyThemes}
              actionableInsights={mockSessionData.actionableInsights}
            />
          </div>

          {/* Right Column - Session Helper */}
          <div className="lg:col-span-1">
            <HelperPanel 
              suggestedQuestions={mockSessionData.suggestedQuestions}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
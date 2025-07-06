interface TranscriptItem {
  speaker: string
  text: string
  timestamp: string
}

interface TranscriptPanelProps {
  transcript: TranscriptItem[]
}

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-therapy-navy">Session Transcript</h3>
        <p className="text-sm text-gray-600 mt-1">Full conversation record</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                item.speaker === 'Therapist' 
                  ? 'text-therapy-coral' 
                  : 'text-therapy-navy'
              }`}>
                {item.speaker}
              </span>
              <span className="text-xs text-gray-500">{item.timestamp}</span>
            </div>
            <div className={`p-3 rounded-lg ${
              item.speaker === 'Therapist'
                ? 'bg-therapy-coral bg-opacity-10 border-l-4 border-therapy-coral'
                : 'bg-therapy-blue bg-opacity-10 border-l-4 border-therapy-blue'
            }`}>
              <p className="text-therapy-navy text-sm leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-3 h-3 bg-therapy-coral rounded-full mr-2"></div>
          <span className="mr-4">Therapist</span>
          <div className="w-3 h-3 bg-therapy-blue rounded-full mr-2"></div>
          <span>Client</span>
        </div>
      </div>
    </div>
  )
} 
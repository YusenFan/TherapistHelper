interface SummaryPanelProps {
  summary: string
  keyThemes: string[]
  actionableInsights: string[]
}

export default function SummaryPanel({ summary, keyThemes, actionableInsights }: SummaryPanelProps) {
  return (
    <div className="h-full space-y-6">
      {/* AI Session Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-therapy-green rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-therapy-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-therapy-navy">AI Session Summary</h3>
        </div>
        <p className="text-therapy-navy leading-relaxed">{summary}</p>
      </div>

      {/* Key Themes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-therapy-navy mb-4">Key Themes</h4>
        <div className="flex flex-wrap gap-2">
          {keyThemes.map((theme, index) => (
            <span 
              key={index}
              className="px-3 py-2 bg-therapy-blue bg-opacity-20 text-therapy-navy rounded-full text-sm font-medium border border-therapy-blue border-opacity-30"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-therapy-coral bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-therapy-navy">Actionable Insights</h4>
        </div>
        <ul className="space-y-3">
          {actionableInsights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <div className="w-2 h-2 bg-therapy-coral rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-therapy-navy text-sm leading-relaxed">{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 
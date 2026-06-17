'use client'

const EHR_LABELS: Record<string, string> = {
  therapynotes: 'TherapyNotes',
  simplepractice: 'SimplePractice',
  janeapp: 'Jane App',
}

const EHR_URLS: Record<string, string> = {
  therapynotes: 'https://www.therapynotes.com/app/patients/',
}

interface Props {
  open: boolean
  ehr?: string | null
  onClose: () => void
}

export default function SyncEHRModal({ open, ehr, onClose }: Props) {
  if (!open) return null

  const effectiveEhr = ehr || 'therapynotes'
  const ehrLabel = EHR_LABELS[effectiveEhr] ?? 'your EHR'
  const ehrUrl = EHR_URLS[effectiveEhr]

  const handleContinue = () => {
    if (ehrUrl) {
      window.open(ehrUrl, '_blank', 'noopener,noreferrer')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-therapy-navy">Session saved</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-700">
            Your session has been saved. Click <span className="font-semibold">Continue</span> to open {ehrLabel} and sync your note.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 flex gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              After {ehrLabel} opens, click the <span className="font-semibold">Therabee</span> extension icon
              in your browser toolbar to push the note into the patient record.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-therapy-navy bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Not now
          </button>
          <button
            onClick={handleContinue}
            className="px-4 py-2 text-sm font-medium text-white bg-therapy-coral rounded-lg hover:bg-opacity-90"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

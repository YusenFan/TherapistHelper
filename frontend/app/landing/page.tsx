import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-therapy-coral rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-therapy-navy">TherapistHelper</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-therapy-navy transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-therapy-navy transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-therapy-navy transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-therapy-navy transition-colors">Contact</a>
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-therapy-gray to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-therapy-navy mb-6 leading-tight">
              AI-Powered Session Assistant for Therapists
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Focus on your clients, not paperwork. Automate transcription, generate insights,
              and prepare for sessions with our confidential AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="px-8 py-4 border-2 border-therapy-navy text-therapy-navy rounded-lg hover:bg-therapy-navy hover:text-white transition-colors font-semibold text-lg"
              >
                Learn More
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              ✓ HIPAA-ready • ✓ Free to start • ✓ No credit card required
            </p>
          </div>

          {/* Preview Image/Graphic */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-therapy-gray rounded-lg p-6">
                  <div className="w-12 h-12 bg-therapy-coral bg-opacity-20 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-therapy-navy mb-2">Client Profiles</h3>
                  <p className="text-sm text-gray-600">Organized, encrypted client database with tags and notes</p>
                </div>
                <div className="bg-therapy-gray rounded-lg p-6">
                  <div className="w-12 h-12 bg-therapy-blue bg-opacity-20 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-therapy-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-therapy-navy mb-2">Auto-Transcription</h3>
                  <p className="text-sm text-gray-600">Record sessions, get instant transcripts</p>
                </div>
                <div className="bg-therapy-gray rounded-lg p-6">
                  <div className="w-12 h-12 bg-therapy-green bg-opacity-20 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-therapy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-therapy-navy mb-2">AI Insights</h3>
                  <p className="text-sm text-gray-600">Generate summaries and therapeutic recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-therapy-navy mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools to help you provide better therapy with less administrative burden
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group">
              <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-therapy-coral bg-opacity-20 rounded-xl mb-6 flex items-center justify-center group-hover:bg-opacity-30 transition-colors">
                  <svg className="w-7 h-7 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-3">Client Database</h3>
                <p className="text-gray-600 leading-relaxed">
                  Organize client profiles with encrypted storage for sensitive information.
                  Tag and categorize clients for easy access.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-therapy-blue bg-opacity-20 rounded-xl mb-6 flex items-center justify-center group-hover:bg-opacity-30 transition-colors">
                  <svg className="w-7 h-7 text-therapy-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-3">Session Transcription</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload audio recordings and get instant transcripts using OpenAI Whisper.
                  Support for multiple formats and languages.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-therapy-green bg-opacity-20 rounded-xl mb-6 flex items-center justify-center group-hover:bg-opacity-30 transition-colors">
                  <svg className="w-7 h-7 text-therapy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-3">AI Analysis</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get AI-powered summaries, insights, and therapeutic recommendations
                  from your session transcripts.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-purple-100 rounded-xl mb-6 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-3">Session Helper</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate pre-session agendas and post-session documentation automatically.
                  Save hours on paperwork.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group">
              <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl mb-6 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-3">Privacy First</h3>
                <p className="text-gray-600 leading-relaxed">
                  All client data is encrypted at rest. AI processing uses confidential
                  Tinfoil.sh API. HIPAA-ready infrastructure.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group">
              <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 bg-red-100 rounded-xl mb-6 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-3">Intake Forms</h3>
                <p className="text-gray-600 leading-relaxed">
                  Comprehensive intake forms for family structure, health history,
                  work, and relationships. Shareable links for clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-therapy-gray">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-therapy-navy mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to transform your practice</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-therapy-coral text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-4">Create Client Profiles</h3>
                <p className="text-gray-600 leading-relaxed">
                  Add clients with encrypted profiles. Send intake forms for them
                  to complete detailed background information.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                <svg className="w-8 h-8 text-therapy-coral" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-therapy-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-4">Record & Transcribe</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload session recordings for automatic transcription.
                  AI analyzes transcripts and generates insights.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                <svg className="w-8 h-8 text-therapy-coral" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-therapy-green text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold text-therapy-navy mb-4">Get AI Insights</h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive session summaries, therapeutic recommendations,
                  and auto-generated documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-therapy-navy mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-therapy-navy mb-2">Free</h3>
              <p className="text-gray-600 mb-6">For individual therapists</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-therapy-navy">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Up to 5 clients
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10 transcriptions/month
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Basic AI analysis
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Email support
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-3 px-6 bg-therapy-navy text-white text-center rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-xl p-8 border-2 border-therapy-coral shadow-xl relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-therapy-coral text-white px-4 py-1 rounded-full text-sm font-semibold">Popular</span>
              </div>
              <h3 className="text-xl font-semibold text-therapy-navy mb-2">Professional</h3>
              <p className="text-gray-600 mb-6">For growing practices</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-therapy-navy">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited clients
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited transcriptions
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Advanced AI insights
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Analytics dashboard
                </li>
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-3 px-6 bg-therapy-coral text-white text-center rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-therapy-navy mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For clinics and practices</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-therapy-navy">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Multi-user support
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Custom integrations
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Dedicated support
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-therapy-green mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  HIPAA BAA included
                </li>
              </ul>
              <a
                href="#contact"
                className="block w-full py-3 px-6 bg-therapy-navy text-white text-center rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-therapy-navy to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Practice?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of therapists who are saving time and providing better care with AI assistance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-lg shadow-lg"
            >
              Start Free Trial
            </Link>
            <a
              href="mailto:hello@therapisthelper.ai"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-therapy-navy transition-colors font-semibold text-lg"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-therapy-coral rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">TherapistHelper</span>
            </div>
            <p className="text-sm">AI-powered session assistant for therapists.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© 2026 TherapistHelper. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient, type ClientData } from '@/lib/api'

interface FormData {
  fullName: string
  age: string
  gender: string
  customGender: string
  background: string
}

interface FormErrors {
  fullName?: string
  age?: string
  gender?: string
  general?: string
}

export default function NewClientPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    gender: '',
    customGender: '',
    background: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isAIEnabled, setIsAIEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maxBackgroundLength = 2400
  const remainingChars = maxBackgroundLength - formData.background.length

  const genderOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other...' }
  ]

  // Real-time validation
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'Client name is required'
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'Name must be at least 2 characters'
        } else {
          delete newErrors.fullName
        }
        break

      case 'age':
        if (!value) {
          newErrors.age = 'Age is required'
        } else if (isNaN(Number(value))) {
          newErrors.age = 'Age must be a number'
        } else if (Number(value) < 0 || Number(value) > 120) {
          newErrors.age = 'Age must be between 0 and 120'
        } else {
          delete newErrors.age
        }
        break

      case 'gender':
        if (!value) {
          newErrors.gender = 'Gender selection is required'
        } else {
          delete newErrors.gender
        }
        break

      default:
        break
    }

    setErrors(newErrors)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const generateAISuggestions = () => {
    if (!isAIEnabled || !formData.fullName || !formData.age || !formData.gender) return

    // Mock AI suggestion based on basic info
    const suggestions = [
      "Initial consultation for therapy services.",
      `${formData.fullName} is a ${formData.age}-year-old seeking support.`,
      "Referral source: Self-referred through online search.",
      "Presenting concerns to be assessed during intake session.",
      "Background history to be gathered during initial assessment."
    ]

    const aiSuggestion = suggestions.join(' ')
    setFormData(prev => ({ 
      ...prev, 
      background: prev.background ? `${prev.background}\n\n${aiSuggestion}` : aiSuggestion 
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Client name is required'
    }
    if (!formData.age) {
      newErrors.age = 'Age is required'
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age (0-120)'
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setErrors(prev => ({ ...prev, general: 'Please complete all required fields' }))
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare client data for API
      const clientData: ClientData = {
        full_name: formData.fullName,
        age: parseInt(formData.age),
        gender: formData.gender,
        custom_gender: formData.gender === 'other' ? formData.customGender : undefined,
        background: formData.background || undefined
      }
      
      // Create client via API
      const newClient = await apiClient.createClient(clientData)
      
      // Redirect to the new client's profile
      router.push(`/clients/${newClient.id}?created=true`)
    } catch (error) {
      console.error('Failed to create client:', error)
      setErrors({ 
        general: error instanceof Error 
          ? error.message 
          : 'Failed to create client profile. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header & Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/clients"
                className="text-therapy-coral hover:text-therapy-coral-dark transition-colors mb-2 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Clients
              </Link>
              <h1 className="text-3xl font-bold text-therapy-navy">New Client Profile</h1>
              <div className="mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="bg-therapy-coral text-white px-2 py-1 rounded-full text-xs font-medium mr-2">1</span>
                  <span>of 2 - Basic Information</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Two-Panel Layout */}
        <div className="space-y-8">
          
          {/* Panel One: Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-therapy-navy mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-therapy-navy mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors ${
                    errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  aria-describedby={errors.fullName ? 'fullName-error' : 'fullName-help'}
                />
                {errors.fullName ? (
                  <p id="fullName-error" className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                ) : (
                  <p id="fullName-help" className="mt-1 text-sm text-gray-500">Required</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-therapy-navy mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="25"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors ${
                    errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  aria-describedby={errors.age ? 'age-error' : 'age-help'}
                />
                {errors.age ? (
                  <p id="age-error" className="mt-1 text-sm text-red-600">{errors.age}</p>
                ) : (
                  <p id="age-help" className="mt-1 text-sm text-gray-500">Required</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <fieldset>
                  <legend className="block text-sm font-medium text-therapy-navy mb-4">
                    Gender <span className="text-red-500">*</span>
                  </legend>
                  <div className="space-y-3">
                    {genderOptions.map((option) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          id={`gender-${option.value}`}
                          name="gender"
                          value={option.value}
                          checked={formData.gender === option.value}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="h-4 w-4 text-therapy-coral focus:ring-therapy-coral border-gray-300"
                        />
                        <label htmlFor={`gender-${option.value}`} className="ml-3 text-sm text-therapy-navy">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Custom Gender Input */}
                  {formData.gender === 'other' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={formData.customGender}
                        onChange={(e) => handleInputChange('customGender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  {errors.gender && (
                    <p className="mt-2 text-sm text-red-600">{errors.gender}</p>
                  )}
                </fieldset>
              </div>
            </div>
          </div>

          {/* Panel Two: Client Background */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-therapy-navy">Background Information</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ai-toggle"
                  checked={isAIEnabled}
                  onChange={(e) => setIsAIEnabled(e.target.checked)}
                  className="h-4 w-4 text-therapy-coral focus:ring-therapy-coral border-gray-300 rounded"
                />
                <label htmlFor="ai-toggle" className="ml-2 text-xs text-gray-600">
                  AI Suggestions
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                rows={8}
                value={formData.background}
                onChange={(e) => {
                  if (e.target.value.length <= maxBackgroundLength) {
                    handleInputChange('background', e.target.value)
                  }
                }}
                placeholder="Enter relevant history, presenting concerns, referral source, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none"
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className={`${remainingChars < 100 ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingChars} characters remaining
                </span>
                
                {isAIEnabled && (
                  <button
                    type="button"
                    onClick={generateAISuggestions}
                    disabled={!formData.fullName || !formData.age || !formData.gender}
                    className="px-3 py-1 bg-therapy-blue bg-opacity-20 text-therapy-navy rounded text-xs hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <Link 
            href="/clients"
            className="text-gray-600 hover:text-therapy-navy transition-colors"
          >
            Cancel
          </Link>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="px-8 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Profile...</span>
              </>
            ) : (
              <span>Create Profile</span>
            )}
          </button>
        </div>
      </main>
    </div>
  )
} 
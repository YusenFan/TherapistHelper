'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient, type ClientResponse, type ClientData } from '@/lib/api'

interface ClientProfileProps {
  params: {
    id: string
  }
}

interface FormData {
  full_name: string
  age: string
  gender: string
  custom_gender: string
  background: string
}

interface FormErrors {
  full_name?: string
  age?: string
  gender?: string
  general?: string
}

export default function ClientProfile({ params }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [clientData, setClientData] = useState<ClientResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Edit form state
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    age: '',
    gender: '',
    custom_gender: '',
    background: ''
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const maxBackgroundLength = 2400

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true)
        setError(null)
        const client = await apiClient.getClient(parseInt(params.id))
        setClientData(client)
        
        // Initialize form data with client data
        setFormData({
          full_name: client.full_name,
          age: client.age.toString(),
          gender: client.gender,
          custom_gender: client.custom_gender || '',
          background: client.background || ''
        })
      } catch (err) {
        console.error('Failed to fetch client:', err)
        setError(err instanceof Error ? err.message : 'Failed to load client data')
      } finally {
        setLoading(false)
      }
    }

    if (params.id && !isNaN(parseInt(params.id))) {
      fetchClient()
    } else {
      setError('Invalid client ID')
      setLoading(false)
    }
  }, [params.id])

  const genderOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other...' }
  ]

  // Form validation
  const validateField = (name: string, value: string) => {
    const newErrors = { ...formErrors }

    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          newErrors.full_name = 'Client name is required'
        } else if (value.trim().length < 2) {
          newErrors.full_name = 'Name must be at least 2 characters'
        } else {
          delete newErrors.full_name
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

    setFormErrors(newErrors)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
    
    // Clear update success message when user starts editing
    if (updateSuccess) {
      setUpdateSuccess(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Client name is required'
    }
    if (!formData.age) {
      newErrors.age = 'Age is required'
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age (0-120)'
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender selection is required'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setFormErrors(prev => ({ ...prev, general: 'Please complete all required fields' }))
      return
    }

    if (!clientData) return

    setIsSubmitting(true)
    
    try {
      // Prepare client data for API
      const updateData: Partial<ClientData> = {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        custom_gender: formData.gender === 'other' ? formData.custom_gender : undefined,
        background: formData.background || undefined
      }
      
      // Update client via API
      const updatedClient = await apiClient.updateClient(clientData.id, updateData)
      
      // Update local state with new data
      setClientData(updatedClient)
      setUpdateSuccess(true)
      setEditMode(false)
      
      // Clear any previous errors
      setFormErrors({})
    } catch (error) {
      console.error('Failed to update client:', error)
      setFormErrors({ 
        general: error instanceof Error 
          ? error.message 
          : 'Failed to update client profile. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    if (!clientData) return
    
    // Reset form data to original values
    setFormData({
      full_name: clientData.full_name,
      age: clientData.age.toString(),
      gender: clientData.gender,
      custom_gender: clientData.custom_gender || '',
      background: clientData.background || ''
    })
    
    setFormErrors({})
    setEditMode(false)
    setUpdateSuccess(false)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'overview' },
    { id: 'sessions', name: 'Sessions', icon: 'sessions' },
    { id: 'insights', name: 'AI Insights', icon: 'insights' },
    { id: 'edit', name: 'Edit Profile', icon: 'edit' }
  ]

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'overview':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'sessions':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'insights':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'edit':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatGender = (gender: string, customGender?: string) => {
    if (gender === 'other' && customGender) {
      return customGender
    }
    return gender.charAt(0).toUpperCase() + gender.slice(1).replace('-', ' ')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link 
                  href="/clients"
                  className="text-therapy-coral hover:text-therapy-coral-dark transition-colors"
                >
                  ← Back to Clients
                </Link>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-therapy-coral"></div>
            <span className="ml-3 text-therapy-navy">Loading client data...</span>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link 
                  href="/clients"
                  className="text-therapy-coral hover:text-therapy-coral-dark transition-colors"
                >
                  ← Back to Clients
                </Link>
                <h1 className="text-3xl font-bold text-therapy-navy">Client Not Found</h1>
              </div>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Client data not found
  if (!clientData) {
    return (
      <div className="min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link 
                  href="/clients"
                  className="text-therapy-coral hover:text-therapy-coral-dark transition-colors"
                >
                  ← Back to Clients
                </Link>
                <h1 className="text-3xl font-bold text-therapy-navy">Client Not Found</h1>
              </div>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-therapy-navy mb-2">No client data found</h3>
            <p className="text-gray-600">The requested client data could not be loaded.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Success Message */}
      {updateSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-therapy-green bg-opacity-20 border border-therapy-green rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-therapy-green mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-therapy-green font-medium">Client profile updated successfully!</p>
          </div>
        </div>
      )}

      {/* Client Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/clients"
                className="text-therapy-coral hover:text-therapy-coral-dark transition-colors"
              >
                ← Back to Clients
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-therapy-coral rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-medium">{getInitials(clientData.full_name)}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-therapy-navy">{clientData.full_name}</h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-gray-600">{clientData.age} years • {formatGender(clientData.gender, clientData.custom_gender)}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-therapy-green bg-opacity-20 text-therapy-green">
                      Active
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-therapy-green bg-opacity-20 text-therapy-green">
                      Low Risk
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                Schedule Session
              </button>
 
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-therapy-coral text-therapy-coral'
                      : 'border-transparent text-gray-500 hover:text-therapy-navy hover:border-gray-300'
                  }`}
                >
                  {getTabIcon(tab.icon)}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-therapy-navy">{clientData.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-therapy-navy">{clientData.age} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-therapy-navy">{formatGender(clientData.gender, clientData.custom_gender)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Client ID</label>
                    <p className="text-therapy-navy">#{clientData.id}</p>
                  </div>
                </div>
              </div>

              {clientData.background && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-therapy-navy mb-4">Background Information</h3>
                  <div className="prose max-w-none">
                    <p className="text-therapy-navy leading-relaxed whitespace-pre-wrap">{clientData.background}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Client Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created Date</span>
                    <span className="text-therapy-navy font-medium">{formatDate(clientData.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-therapy-navy font-medium">{formatDate(clientData.updated_at)}</span>
                  </div>
                
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="text-therapy-navy font-medium">Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-semibold text-therapy-navy mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">This client hasn't had any therapy sessions yet.</p>
            <button className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
              Schedule First Session
            </button>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold text-therapy-navy mb-2">AI Insights Coming Soon</h3>
            <p className="text-gray-600 mb-4">AI-powered insights and analysis will be available once session data is recorded.</p>
            <button className="px-6 py-3 bg-therapy-blue text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
              Learn More
            </button>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="max-w-4xl mx-auto">
            {/* Error Banner */}
            {formErrors.general && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-800">{formErrors.general}</p>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Personal Information Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-therapy-navy">Edit Client Information</h2>
                  <div className="flex items-center space-x-3">
                    {!editMode && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-therapy-navy mb-2">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="e.g. Jordan Smith"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors ${
                          formErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-therapy-navy">{clientData.full_name}</p>
                    )}
                    {formErrors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-therapy-navy mb-2">
                      Age <span className="text-red-500">*</span>
                    </label>
                    {editMode ? (
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
                          formErrors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-therapy-navy">{clientData.age} years</p>
                    )}
                    {formErrors.age && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.age}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <fieldset>
                      <legend className="block text-sm font-medium text-therapy-navy mb-4">
                        Gender <span className="text-red-500">*</span>
                      </legend>
                      {editMode ? (
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
                      ) : (
                        <p className="px-4 py-3 bg-gray-50 rounded-lg text-therapy-navy">
                          {formatGender(clientData.gender, clientData.custom_gender)}
                        </p>
                      )}
                      
                      {/* Custom Gender Input */}
                      {editMode && formData.gender === 'other' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            placeholder="Please specify"
                            value={formData.custom_gender}
                            onChange={(e) => handleInputChange('custom_gender', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                          />
                        </div>
                      )}
                      
                      {formErrors.gender && (
                        <p className="mt-2 text-sm text-red-600">{formErrors.gender}</p>
                      )}
                    </fieldset>
                  </div>
                </div>
              </div>

              {/* Background Information Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Background Information</h3>

                <div className="space-y-4">
                  {editMode ? (
                    <>
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
                        <span className={`${maxBackgroundLength - formData.background.length < 100 ? 'text-red-500' : 'text-gray-500'}`}>
                          {maxBackgroundLength - formData.background.length} characters remaining
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="prose max-w-none">
                      {clientData.background ? (
                        <p className="text-therapy-navy leading-relaxed whitespace-pre-wrap">{clientData.background}</p>
                      ) : (
                        <p className="text-gray-400 italic">No background information available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {editMode && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-600 hover:text-therapy-navy transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || Object.keys(formErrors).length > 0}
                    className="px-8 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 
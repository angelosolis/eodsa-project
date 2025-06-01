'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DANCE_STYLES } from '@/lib/types';

interface DancerForm {
  name: string;
  age: string;
  style: string;
  nationalId: string;
}

interface RegistrationForm {
  type: 'studio' | 'private';
  name: string;
  email: string;
  phone: string;
  studioName: string;
  studioAddress: string;
  studioContactPerson: string;
  studioRegistrationNumber: string;
  dancers: DancerForm[];
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationForm>({
    type: 'studio',
    name: '',
    email: '',
    phone: '',
    studioName: '',
    studioAddress: '',
    studioContactPerson: '',
    studioRegistrationNumber: '',
    dancers: [{ name: '', age: '', style: '', nationalId: '' }]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eodsaId, setEodsaId] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDancerChange = (index: number, field: keyof DancerForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      dancers: prev.dancers.map((dancer, i) => 
        i === index ? { ...dancer, [field]: value } : dancer
      )
    }));
  };

  const addDancer = () => {
    setFormData(prev => ({
      ...prev,
      dancers: [...prev.dancers, { name: '', age: '', style: '', nationalId: '' }]
    }));
  };

  const removeDancer = (index: number) => {
    if (formData.dancers.length > 1) {
      setFormData(prev => ({
        ...prev,
        dancers: prev.dancers.filter((_, i) => i !== index)
      }));
    }
  };

  const handleTypeChange = (type: 'studio' | 'private') => {
    setFormData(prev => ({
      ...prev,
      type,
      dancers: type === 'private' ? [{ name: '', age: '', style: '', nationalId: '' }] : prev.dancers
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate dancers
      const validDancers = formData.dancers.filter(dancer => 
        dancer.name && dancer.age && dancer.style && dancer.nationalId
      );
      
      if (validDancers.length === 0) {
        alert('Please add at least one dancer with complete information.');
        setIsSubmitting(false);
        return;
      }

      // Prepare registration data
      const registrationData = {
        name: formData.type === 'studio' ? formData.studioName : formData.name,
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        studioName: formData.type === 'studio' ? formData.studioName : undefined,
        studioInfo: formData.type === 'studio' ? {
          address: formData.studioAddress,
          contactPerson: formData.studioContactPerson,
          registrationNumber: formData.studioRegistrationNumber
        } : undefined,
        dancers: validDancers.map(dancer => ({
          name: dancer.name,
          age: parseInt(dancer.age),
          style: dancer.style,
          nationalId: dancer.nationalId
        }))
      };

      const response = await fetch('/api/contestants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        const result = await response.json();
        setEodsaId(result.eodsaId);
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(`Registration failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Registration Complete! 🎉
            </h2>
            
            {/* E-O-D-S-A ID Display */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 rounded-2xl p-6 mb-8">
              <div className="text-sm font-medium text-purple-700 mb-2">Your E-O-D-S-A ID</div>
              <div className="text-2xl font-bold text-purple-900 mb-2 font-mono tracking-wider">{eodsaId}</div>
              <div className="text-xs text-purple-600">⚠️ Save this ID - you'll need it for event entries</div>
            </div>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              Congratulations! You're now registered in the E-O-D-S-A competition system. 
              Use your ID to enter competitions and track your performances.
            </p>
            
            <div className="space-y-4">
              <Link 
                href={`/event-entry?eodsaId=${eodsaId}`}
                className="block w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🎪 Enter Your First Competition
              </Link>
              
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEodsaId('');
                  setFormData({
                    type: 'studio',
                    name: '',
                    email: '',
                    phone: '',
                    studioName: '',
                    studioAddress: '',
                    studioContactPerson: '',
                    studioRegistrationNumber: '',
                    dancers: [{ name: '', age: '', style: '', nationalId: '' }]
                  });
                }}
                className="block w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                ➕ Register Another Contestant
              </button>
              
              <Link 
                href="/" 
                className="block w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                🏠 Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent)] "></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
              
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Join E-O-D-S-A
            </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Register your dancers and become part of South Africa's premier dance competition community.
            </p>
          </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Registration Type Toggle */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Choose Registration Type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('studio')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        formData.type === 'studio'
                          ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                          : 'border-gray-300 bg-white hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${
                          formData.type === 'studio' ? 'bg-purple-500' : 'bg-gray-400 group-hover:bg-purple-400'
                        }`}>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2">Dance Studio</h4>
                        <p className="text-sm text-gray-600">Register multiple dancers from your studio</p>
              </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('private')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        formData.type === 'private'
                          ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                          : 'border-gray-300 bg-white hover:border-pink-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${
                          formData.type === 'private' ? 'bg-pink-500' : 'bg-gray-400 group-hover:bg-pink-400'
                        }`}>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2">Individual Dancer</h4>
                        <p className="text-sm text-gray-600">Register as a private contestant</p>
                      </div>
                    </button>
                  </div>
              </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                  required
                />
              </div>
                    <div className="relative">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                  required
                />
                    </div>
                  </div>
              </div>

                {/* Studio Information (if studio type) */}
              {formData.type === 'studio' && (
                  <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Studio Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studioName" className="block text-sm font-medium text-gray-700 mb-2">
                    Studio Name *
                  </label>
                  <input
                    type="text"
                    id="studioName"
                    name="studioName"
                    value={formData.studioName}
                    onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                          required={formData.type === 'studio'}
                        />
                      </div>
                      <div>
                        <label htmlFor="studioContactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          id="studioContactPerson"
                          name="studioContactPerson"
                          value={formData.studioContactPerson}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                          required={formData.type === 'studio'}
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <label htmlFor="studioAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Studio Address *
                      </label>
                      <input
                        type="text"
                        id="studioAddress"
                        name="studioAddress"
                        value={formData.studioAddress}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                    required={formData.type === 'studio'}
                  />
                    </div>
                    <div className="mt-6">
                      <label htmlFor="studioRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Studio Registration Number (Optional)
                      </label>
                      <input
                        type="text"
                        id="studioRegistrationNumber"
                        name="studioRegistrationNumber"
                        value={formData.studioRegistrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Private Registration Name */}
                {formData.type === 'private' && (
                  <div className="bg-pink-50 rounded-2xl p-6 border border-pink-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personal Details
                    </h3>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-white"
                        required={formData.type === 'private'}
                      />
                    </div>
                </div>
              )}

                {/* Dancers Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {formData.type === 'studio' ? 'Studio Dancers' : 'Dancer Information'}
                    </h3>
                    {formData.type === 'studio' && (
                      <button
                        type="button"
                        onClick={addDancer}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        ➕ Add Dancer
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {formData.dancers.map((dancer, index) => (
                      <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                              {index + 1}
                            </span>
                            {formData.type === 'studio' ? `Dancer ${index + 1}` : 'Your Information'}
                          </h4>
                          {formData.type === 'studio' && formData.dancers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDancer(index)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={dancer.name}
                              onChange={(e) => handleDancerChange(index, 'name', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Age *
                            </label>
                            <input
                              type="number"
                              min="3"
                              max="99"
                              value={dancer.age}
                              onChange={(e) => handleDancerChange(index, 'age', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Primary Dance Style *
                            </label>
                            <select
                              value={dancer.style}
                              onChange={(e) => handleDancerChange(index, 'style', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            >
                              <option value="">Select a style</option>
                              {DANCE_STYLES.map(style => (
                                <option key={style} value={style}>{style}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              National ID Number *
                            </label>
                            <input
                              type="text"
                              value={dancer.nationalId}
                              onChange={(e) => handleDancerChange(index, 'nationalId', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              {/* Submit Button */}
                <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-3 border-white/30 rounded-full"></div>
                      </div>
                      <span>Creating Your E-O-D-S-A Profile...</span>
                    </div>
                  ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Complete Registration & Get E-O-D-S-A ID
                      </span>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
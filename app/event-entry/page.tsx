'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { REGIONS, PERFORMANCE_TYPES, AGE_CATEGORIES } from '@/lib/types';

interface EventEntryForm {
  eodsaId: string;
  region: string;
  performanceType: string;
  participantIds: string[];
  ageCategory: string;
  paymentMethod: 'credit_card' | 'bank_transfer';
}

interface Contestant {
  id: string;
  eodsaId: string;
  name: string;
  email: string;
  type: 'studio' | 'private';
  dancers: Array<{
    id: string;
    name: string;
    age: number;
    style: string;
  }>;
}

export default function EventEntryPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<EventEntryForm>({
    eodsaId: searchParams?.get('eodsaId') || '',
    region: '',
    performanceType: '',
    participantIds: [],
    ageCategory: '',
    paymentMethod: 'credit_card'
  });
  
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Load contestant data when E-O-D-S-A ID is provided
  useEffect(() => {
    if (formData.eodsaId) {
      loadContestant(formData.eodsaId);
    }
  }, [formData.eodsaId]);

  // Calculate fee when relevant fields change
  useEffect(() => {
    if (formData.ageCategory && formData.performanceType) {
      calculateFee();
    }
  }, [formData.ageCategory, formData.performanceType]);

  const loadContestant = async (eodsaId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/contestants/by-eodsa-id/${eodsaId}`);
      if (response.ok) {
        const data = await response.json();
        setContestant(data);
        // Auto-select first dancer for private registrations
        if (data.type === 'private' && data.dancers.length > 0) {
          setFormData(prev => ({
            ...prev,
            participantIds: [data.dancers[0].id]
          }));
        }
      } else {
        setError('E-O-D-S-A ID not found. Please check your ID or register first.');
      }
    } catch (error) {
      setError('Failed to load contestant data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFee = async () => {
    try {
      const response = await fetch(`/api/fee-calculation?ageCategory=${formData.ageCategory}&performanceType=${formData.performanceType}`);
      if (response.ok) {
        const data = await response.json();
        setCalculatedFee(data.fee);
      }
    } catch (error) {
      console.error('Failed to calculate fee:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParticipantToggle = (dancerId: string) => {
    setFormData(prev => {
      const isSelected = prev.participantIds.includes(dancerId);
      let newParticipantIds;
      
      if (isSelected) {
        newParticipantIds = prev.participantIds.filter(id => id !== dancerId);
      } else {
        // Check limits based on performance type
        const maxParticipants = getMaxParticipants(prev.performanceType);
        if (prev.participantIds.length < maxParticipants) {
          newParticipantIds = [...prev.participantIds, dancerId];
        } else {
          alert(`Maximum ${maxParticipants} participants allowed for ${prev.performanceType}`);
          return prev;
        }
      }
      
      return {
        ...prev,
        participantIds: newParticipantIds
      };
    });
  };

  const getMaxParticipants = (performanceType: string) => {
    switch (performanceType) {
      case 'Solo': return 1;
      case 'Duet': return 2;
      case 'Trio': return 3;
      case 'Group': return 30;
      default: return 1;
    }
  };

  const getMinParticipants = (performanceType: string) => {
    switch (performanceType) {
      case 'Solo': return 1;
      case 'Duet': return 2;
      case 'Trio': return 3;
      case 'Group': return 4;
      default: return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate participant count
      const minParticipants = getMinParticipants(formData.performanceType);
      const maxParticipants = getMaxParticipants(formData.performanceType);
      
      if (formData.participantIds.length < minParticipants) {
        setError(`${formData.performanceType} requires at least ${minParticipants} participant(s)`);
        setIsSubmitting(false);
        return;
      }
      
      if (formData.participantIds.length > maxParticipants) {
        setError(`${formData.performanceType} allows maximum ${maxParticipants} participant(s)`);
        setIsSubmitting(false);
        return;
      }

      const eventEntryData = {
        contestantId: contestant!.id,
        eodsaId: formData.eodsaId,
        region: formData.region,
        performanceType: formData.performanceType,
        participantIds: formData.participantIds,
        ageCategory: formData.ageCategory,
        calculatedFee,
        paymentStatus: 'pending',
        paymentMethod: formData.paymentMethod,
        approved: false
      };

      const response = await fetch('/api/event-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventEntryData),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to submit event entry');
      }
    } catch (error) {
      setError('Failed to submit event entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Entry Submitted!</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">Entry Details:</p>
              <p className="text-sm text-blue-900">{formData.region} - {formData.performanceType}</p>
              <p className="text-sm text-blue-900">{formData.ageCategory}</p>
              <p className="text-lg font-bold text-blue-900">Fee: R{calculatedFee.toFixed(2)}</p>
            </div>
            <p className="text-gray-600 mb-6">
              Your event entry is pending approval. You will be contacted regarding payment and scheduling.
            </p>
            <div className="space-y-3">
              <Link 
                href="/event-entry"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Enter Another Event
              </Link>
              <Link 
                href="/" 
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Event Entry
            </h1>
            <p className="text-xl text-gray-600">
              Enter your performances for the E-O-D-S-A competition.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* E-O-D-S-A ID Input */}
            <div className="mb-8">
              <label htmlFor="eodsaId" className="block text-sm font-medium text-gray-700 mb-2">
                E-O-D-S-A ID *
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  id="eodsaId"
                  name="eodsaId"
                  value={formData.eodsaId}
                  onChange={handleInputChange}
                  placeholder="Enter your E-O-D-S-A ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => loadContestant(formData.eodsaId)}
                  disabled={!formData.eodsaId || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Load'}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Contestant Info Display */}
            {contestant && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Contestant Information</h3>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {contestant.name} ({contestant.type})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {contestant.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Dancers:</strong> {contestant.dancers.length}
                </p>
              </div>
            )}

            {/* Event Entry Form */}
            {contestant && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Region Selection */}
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                    Region *
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a region</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Performance Type */}
                <div>
                  <label htmlFor="performanceType" className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Type *
                  </label>
                  <select
                    id="performanceType"
                    name="performanceType"
                    value={formData.performanceType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select performance type</option>
                    {PERFORMANCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Participant Selection */}
                {formData.performanceType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Participants * 
                      <span className="text-xs text-gray-500">
                        ({getMinParticipants(formData.performanceType)}-{getMaxParticipants(formData.performanceType)} participants)
                      </span>
                    </label>
                    <div className="space-y-2">
                      {contestant.dancers.map(dancer => (
                        <label key={dancer.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.participantIds.includes(dancer.id)}
                            onChange={() => handleParticipantToggle(dancer.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{dancer.name}</div>
                            <div className="text-sm text-gray-500">Age: {dancer.age}, Style: {dancer.style}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Age Category */}
                <div>
                  <label htmlFor="ageCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Age Category *
                  </label>
                  <select
                    id="ageCategory"
                    name="ageCategory"
                    value={formData.ageCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select age category</option>
                    {AGE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Fee Display */}
                {calculatedFee > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Entry Fee</h3>
                    <p className="text-2xl font-bold text-blue-900">R{calculatedFee.toFixed(2)}</p>
                    <p className="text-sm text-blue-700">
                      {formData.ageCategory} - {formData.performanceType}
                    </p>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Payment Method *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit_card"
                        checked={formData.paymentMethod === 'credit_card'}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      Credit Card
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={formData.paymentMethod === 'bank_transfer'}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      Bank Transfer
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || calculatedFee === 0}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </div>
                    ) : (
                      `Submit Entry - R${calculatedFee.toFixed(2)}`
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Registration Link */}
            {!contestant && !isLoading && (
              <div className="text-center mt-8">
                <p className="text-gray-600 mb-4">Don't have an E-O-D-S-A ID yet?</p>
                <Link 
                  href="/register"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Register Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
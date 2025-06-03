'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AGE_CATEGORIES, MASTERY_LEVELS, ITEM_STYLES, TIME_LIMITS, calculateEODSAFee } from '@/lib/types';

interface Event {
  id: string;
  name: string;
  description: string;
  region: string;
  ageCategory: string;
  performanceType: string;
  eventDate: string;
  registrationDeadline: string;
  venue: string;
  status: string;
  maxParticipants?: number;
  entryFee: number;
}

interface Contestant {
  id: string;
  eodsaId: string;
  name: string;
  email: string;
  phone: string;
  type: 'studio' | 'private';
  studioName?: string;
  dancers: {
    id: string;
    name: string;
    age: number;
    style: string;
    nationalId: string;
  }[];
}

interface EventEntryForm {
  eventId: string;
  participantIds: string[];
  ageCategory: string;
  paymentMethod: 'credit_card' | 'bank_transfer';
  itemName: string;
  choreographer: string;
  mastery: string;
  itemStyle: string;
  estimatedDuration: number;
  itemNumber?: number;
}

export default function PerformanceTypeEntryPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  
  const region = params?.region as string;
  const performanceType = params?.performanceType as string;
  const eodsaId = searchParams?.get('eodsaId') || '';
  
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState<EventEntryForm>({
    eventId: '',
    participantIds: [],
    ageCategory: '',
    paymentMethod: 'credit_card',
    itemName: '',
    choreographer: '',
    mastery: '',
    itemStyle: '',
    estimatedDuration: 3,
    itemNumber: undefined
  });
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1); // 1: Event Selection, 2: Details, 3: Payment, 4: Review

  useEffect(() => {
    if (eodsaId) {
      loadContestant(eodsaId);
    }
    loadMatchingEvents();
  }, [region, performanceType, eodsaId]);

  useEffect(() => {
    if (formData.eventId) {
      const selectedEvent = events.find(e => e.id === formData.eventId);
      if (selectedEvent) {
        setCalculatedFee(selectedEvent.entryFee);
        setFormData(prev => ({
          ...prev,
          ageCategory: selectedEvent.ageCategory
        }));
      }
    }
  }, [formData.eventId, events]);

  useEffect(() => {
    if (formData.eventId && formData.mastery && formData.participantIds.length > 0) {
      // Use EODSA fee calculation
      const feeBreakdown = calculateEODSAFee(
        formData.mastery,
        performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
        formData.participantIds.length
      );
      setCalculatedFee(feeBreakdown.totalFee);
    }
  }, [formData.eventId, formData.mastery, formData.participantIds.length, performanceType]);

  const loadContestant = async (id: string) => {
    try {
      const response = await fetch(`/api/contestants/by-eodsa-id/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContestant(data);
        
        // Auto-select participants for private users
        if (data.type === 'private' && data.dancers.length > 0) {
          const performanceTypeLower = performanceType?.toLowerCase();
          if (performanceTypeLower === 'solo') {
            setFormData(prev => ({
              ...prev,
              participantIds: [data.dancers[0].id]
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load contestant data:', error);
    }
  };

  const loadMatchingEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const matchingEvents = data.events.filter((event: Event) => 
            event.region.toLowerCase() === region?.toLowerCase() &&
            event.performanceType.toLowerCase() === performanceType?.toLowerCase() &&
            (event.status === 'registration_open' || event.status === 'upcoming')
          );
          setEvents(matchingEvents);
          
          // Auto-select if only one event
          if (matchingEvents.length === 1) {
            setFormData(prev => ({
              ...prev,
              eventId: matchingEvents[0].id
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
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
      
      const limits = getParticipantLimits();
      
      if (isSelected) {
        newParticipantIds = prev.participantIds.filter(id => id !== dancerId);
      } else {
        if (prev.participantIds.length < limits.max) {
          newParticipantIds = [...prev.participantIds, dancerId];
        } else {
          alert(`Maximum ${limits.max} participants allowed for ${performanceType}`);
          return prev;
        }
      }
      
      return {
        ...prev,
        participantIds: newParticipantIds
      };
    });
  };

  const getParticipantLimits = () => {
    const performanceTypeLower = performanceType?.toLowerCase();
    switch (performanceTypeLower) {
      case 'solo': return { min: 1, max: 1 };
      case 'duet': return { min: 2, max: 2 };
      case 'trio': return { min: 3, max: 3 };
      case 'group': return { min: 4, max: 30 };
      default: return { min: 1, max: 1 };
    }
  };

  const validateDuration = (duration: number): boolean => {
    const performanceTypeLower = performanceType?.toLowerCase();
    const maxDuration = TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS];
    
    if (maxDuration && duration > maxDuration) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const limits = getParticipantLimits();
      
      if (formData.participantIds.length < limits.min) {
        alert(`${performanceType} requires at least ${limits.min} participant(s)`);
        setIsSubmitting(false);
        return;
      }

      if (!validateDuration(formData.estimatedDuration)) {
        const maxTime = TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS];
        alert(`${performanceType} performances must be ${maxTime} minutes or less`);
        setIsSubmitting(false);
        return;
      }

      const eventEntryData = {
        eventId: formData.eventId,
        contestantId: contestant!.id,
        eodsaId: eodsaId,
        participantIds: formData.participantIds,
        calculatedFee,
        paymentStatus: 'pending',
        paymentMethod: formData.paymentMethod,
        approved: false,
        itemName: formData.itemName,
        choreographer: formData.choreographer,
        mastery: formData.mastery,
        itemStyle: formData.itemStyle,
        estimatedDuration: formData.estimatedDuration,
        itemNumber: formData.itemNumber
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
        alert(`Entry failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Entry error:', error);
      alert('Entry failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.eventId) {
      alert('Please select an event first');
      return;
    }
    if (step === 2 && formData.participantIds.length === 0) {
      alert('Please select participants');
      return;
    }
    if (step === 2 && !formData.itemName) {
      alert('Please fill in all performance details');
      return;
    }
    if (step === 2 && !validateDuration(formData.estimatedDuration)) {
      const maxTime = TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS];
      alert(`${performanceType} performances must be ${maxTime} minutes or less`);
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/20 p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-4">Entry Submitted!</h2>
          <p className="text-gray-300 mb-6">
            Your {performanceType} entry for {region} has been submitted successfully.
          </p>
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30 rounded-2xl p-6 mb-6">
            <p className="text-sm font-medium text-purple-300 mb-2">Status</p>
            <p className="text-lg font-bold text-purple-200">⏳ Awaiting Judging</p>
          </div>
          <div className="space-y-3">
            <Link 
              href={`/event-dashboard?eodsaId=${eodsaId}`}
              className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold"
            >
              Enter Another Event
            </Link>
            <Link 
              href="/"
              className="block w-full px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 font-semibold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!region || !performanceType || !eodsaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/20 p-8 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">Missing Information</h2>
          <p className="text-gray-300 mb-6">Required parameters not provided.</p>
          <Link 
            href="/"
            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href={`/event-dashboard/${region}?eodsaId=${eodsaId}`} 
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {region} Events
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {performanceType?.charAt(0).toUpperCase() + performanceType?.slice(1)} Entry
          </h1>
          <p className="text-xl text-gray-300">{region} Region - Step {step} of 4</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700/20 p-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    stepNum <= step 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                      : 'bg-gray-600 text-gray-400'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      stepNum < step ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gray-600'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-300">
              <span>Event</span>
              <span>Details</span>
              <span>Payment</span>
              <span>Review</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/20 p-8">
            
            {/* Step 1: Event Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Select Event</h2>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Events Available</h3>
                    <p className="text-gray-300">No {performanceType} events are currently available in {region}.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => setFormData(prev => ({ ...prev, eventId: event.id }))}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                          formData.eventId === event.id
                            ? 'border-purple-400 bg-purple-900/30'
                            : 'border-gray-600 hover:border-purple-400 bg-gray-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{event.name}</h3>
                            <p className="text-gray-300 mb-2">{event.description}</p>
                            <div className="text-sm text-gray-400 space-y-1">
                              <p>📅 {new Date(event.eventDate).toLocaleDateString()}</p>
                              <p>📍 {event.venue}</p>
                              <p>🎯 Age Category: {event.ageCategory}</p>
                              <p>⏰ Registration Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-400">R{event.entryFee.toFixed(2)}</p>
                            <p className="text-sm text-gray-400">Entry Fee</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Performance Details */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Performance Details</h2>
                
                {/* Participant Selection */}
                {contestant && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Select Participants</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contestant.dancers.map((dancer) => (
                        <div
                          key={dancer.id}
                          onClick={() => handleParticipantToggle(dancer.id)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                            formData.participantIds.includes(dancer.id)
                              ? 'border-purple-400 bg-purple-900/30'
                              : 'border-gray-600 hover:border-purple-400 bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              formData.participantIds.includes(dancer.id)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-600 text-gray-300'
                            }`}>
                              {dancer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{dancer.name}</p>
                              <p className="text-sm text-gray-400">Age: {dancer.age} | Style: {dancer.style}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Selected: {formData.participantIds.length} / {getParticipantLimits().max}
                    </p>
                  </div>
                )}

                {/* Performance Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Item Name *</label>
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      placeholder="Name of your performance piece"
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Choreographer *</label>
                    <input
                      type="text"
                      name="choreographer"
                      value={formData.choreographer}
                      onChange={handleInputChange}
                      placeholder="Name of the choreographer"
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Item Number</label>
                    <input
                      type="number"
                      name="itemNumber"
                      value={formData.itemNumber || ''}
                      onChange={handleInputChange}
                      placeholder="Optional program order number"
                      className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                      min="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Optional: For program ordering (can be assigned later by admin)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Mastery Level *</label>
                      <select
                        name="mastery"
                        value={formData.mastery}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                        required
                      >
                        <option value="">Select mastery level</option>
                        {MASTERY_LEVELS.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Item Style *</label>
                      <select
                        name="itemStyle"
                        value={formData.itemStyle}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                        required
                      >
                        <option value="">Select item style</option>
                        {ITEM_STYLES.map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estimated Duration (minutes) * 
                      {performanceType && TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS] && (
                        <span className="text-purple-400 ml-2">
                          (Max: {TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS]} min)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleInputChange}
                      min="0.5"
                      max={TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS] || 10}
                      step="0.5"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 ${
                        validateDuration(formData.estimatedDuration) 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-red-500 bg-red-900/30'
                      }`}
                      required
                    />
                    {!validateDuration(formData.estimatedDuration) && (
                      <p className="text-red-400 text-xs mt-1">
                        Duration exceeds maximum allowed for {performanceType} ({TIME_LIMITS[performanceType as keyof typeof TIME_LIMITS]} minutes)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Payment Method</h2>
                
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-purple-300 mb-4">EODSA Fee Breakdown</h3>
                    {formData.mastery && formData.participantIds.length > 0 && (() => {
                      const feeBreakdown = calculateEODSAFee(
                        formData.mastery,
                        performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
                        formData.participantIds.length
                      );
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-purple-200">
                            <span>Registration Fee ({formData.participantIds.length} participant{formData.participantIds.length > 1 ? 's' : ''})</span>
                            <span className="font-semibold">R{feeBreakdown.registrationFee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-purple-200">
                            <span>Performance Fee ({performanceType})</span>
                            <span className="font-semibold">R{feeBreakdown.performanceFee.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-purple-400/30 pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-purple-100">Total Amount Due:</span>
                              <span className="text-2xl font-bold text-purple-100">R{feeBreakdown.totalFee.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-sm text-purple-400 mt-2">
                            <p>Mastery Level: {formData.mastery}</p>
                            <p>Performance Type: {performanceType}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Select Payment Method</h3>
                  
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'credit_card' }))}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                      formData.paymentMethod === 'credit_card'
                        ? 'border-purple-400 bg-purple-900/30'
                        : 'border-gray-600 hover:border-purple-400 bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">💳</div>
                      <div>
                        <h4 className="font-semibold text-white">Credit Card</h4>
                        <p className="text-sm text-gray-300">Pay securely with your credit or debit card</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                      formData.paymentMethod === 'bank_transfer'
                        ? 'border-purple-400 bg-purple-900/30'
                        : 'border-gray-600 hover:border-purple-400 bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">🏦</div>
                      <div>
                        <h4 className="font-semibold text-white">Bank Transfer</h4>
                        <p className="text-sm text-gray-300">Direct bank transfer (EFT)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Review & Submit</h2>
                
                <div className="space-y-6">
                  {/* Event Summary */}
                  <div className="bg-gray-700/50 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-3">Event Details</h3>
                    {(() => {
                      const selectedEvent = events.find(e => e.id === formData.eventId);
                      return selectedEvent ? (
                        <div className="text-sm text-gray-300 space-y-1">
                          <p><strong>Event:</strong> {selectedEvent.name}</p>
                          <p><strong>Region:</strong> {selectedEvent.region}</p>
                          <p><strong>Performance Type:</strong> {selectedEvent.performanceType}</p>
                          <p><strong>Date:</strong> {new Date(selectedEvent.eventDate).toLocaleDateString()}</p>
                          <p><strong>Venue:</strong> {selectedEvent.venue}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Performance Summary */}
                  <div className="bg-gray-700/50 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-3">Performance Details</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><strong>Item Name:</strong> {formData.itemName}</p>
                      <p><strong>Choreographer:</strong> {formData.choreographer}</p>
                      <p><strong>Mastery Level:</strong> {formData.mastery}</p>
                      <p><strong>Item Style:</strong> {formData.itemStyle}</p>
                      <p><strong>Duration:</strong> {formData.estimatedDuration} minutes</p>
                      <p><strong>Participants:</strong> {formData.participantIds.length}</p>
                      {formData.itemNumber && (
                        <p><strong>Item Number:</strong> {formData.itemNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-300 mb-3">EODSA Payment Summary</h3>
                    {formData.mastery && formData.participantIds.length > 0 && (() => {
                      const feeBreakdown = calculateEODSAFee(
                        formData.mastery,
                        performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
                        formData.participantIds.length
                      );
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between text-purple-200">
                            <span>Registration Fee ({formData.participantIds.length} participant{formData.participantIds.length > 1 ? 's' : ''})</span>
                            <span>R{feeBreakdown.registrationFee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-purple-200">
                            <span>Performance Fee ({performanceType})</span>
                            <span>R{feeBreakdown.performanceFee.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-purple-400/30 pt-2 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-purple-100">Total Amount Due:</span>
                              <span className="text-xl font-bold text-purple-100">R{feeBreakdown.totalFee.toFixed(2)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-purple-400 mt-2">
                            Payment Method: {formData.paymentMethod === 'credit_card' ? 'Credit Card' : 'Bank Transfer'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {step < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Entry'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AGE_CATEGORIES, MASTERY_LEVELS, ITEM_STYLES, TIME_LIMITS, calculateEODSAFee } from '@/lib/types';
import { useAlert } from '@/components/ui/custom-alert';

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
    estimatedDuration: 3
  });
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1); // 1: Event Selection, 2: Details, 3: Payment, 4: Review
  const { showAlert } = useAlert();

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
      // Try unified system first (new dancers)
      const unifiedResponse = await fetch(`/api/dancers/by-eodsa-id/${id}`);
      if (unifiedResponse.ok) {
        const unifiedData = await unifiedResponse.json();
        if (unifiedData.success && unifiedData.dancer) {
          const dancer = unifiedData.dancer;
          // Transform single dancer to contestant format
          const transformedContestant = {
            id: dancer.id,
            eodsaId: dancer.eodsaId,
            name: dancer.name,
            email: dancer.email || '',
            phone: dancer.phone || '',
            type: 'private' as const,
            dancers: [{
              id: dancer.id,
              name: dancer.name,
              age: dancer.age,
              style: '',
              nationalId: dancer.nationalId
            }]
          };
          setContestant(transformedContestant);
          
          // Auto-select participants for private users
          if (transformedContestant.type === 'private' && transformedContestant.dancers.length > 0) {
            const performanceTypeLower = performanceType?.toLowerCase();
            if (performanceTypeLower === 'solo') {
              setFormData(prev => ({
                ...prev,
                participantIds: [transformedContestant.dancers[0].id]
              }));
            }
          }
          return;
        }
      }
      
      // Fallback to legacy system (contestants)
      const legacyResponse = await fetch(`/api/contestants/by-eodsa-id/${id}`);
      if (legacyResponse.ok) {
        const legacyData = await legacyResponse.json();
        setContestant(legacyData);
        
        // Auto-select participants for private users
        if (legacyData.type === 'private' && legacyData.dancers.length > 0) {
          const performanceTypeLower = performanceType?.toLowerCase();
          if (performanceTypeLower === 'solo') {
            setFormData(prev => ({
              ...prev,
              participantIds: [legacyData.dancers[0].id]
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
          showAlert(`Maximum ${limits.max} participants allowed for ${performanceType}`, 'warning');
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

  // Helper function to get time limit for current performance type
  const getTimeLimit = () => {
    const capitalizedType = performanceType?.charAt(0).toUpperCase() + performanceType?.slice(1).toLowerCase();
    return TIME_LIMITS[capitalizedType as keyof typeof TIME_LIMITS] || 0;
  };

  const validateDuration = (duration: number): boolean => {
    const maxDuration = getTimeLimit();
    return maxDuration > 0 ? duration <= maxDuration : false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const limits = getParticipantLimits();
      
      if (formData.participantIds.length < limits.min) {
        showAlert(`${performanceType} requires at least ${limits.min} participant(s)`, 'warning');
        setIsSubmitting(false);
        return;
      }

      if (!validateDuration(formData.estimatedDuration)) {
        const maxTime = getTimeLimit();
        const maxTimeDisplay = maxTime === 3.5 ? '3:30' : `${maxTime}:00`;
        showAlert(`${performanceType} performances must be ${maxTimeDisplay} minutes or less`, 'warning');
        setIsSubmitting(false);
        return;
      }

      // Calculate EODSA fee correctly
      const feeBreakdown = calculateEODSAFee(
        formData.mastery,
        performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
        formData.participantIds.length
      );

      const eventEntryData = {
        eventId: formData.eventId,
        contestantId: contestant!.id,
        eodsaId: eodsaId,
        participantIds: formData.participantIds,
        calculatedFee: feeBreakdown.totalFee,
        paymentStatus: 'pending',
        paymentMethod: 'invoice', // Phase 1: Invoice-based payment
        approved: false,
        itemName: formData.itemName,
        choreographer: formData.choreographer,
        mastery: formData.mastery,
        itemStyle: formData.itemStyle,
        estimatedDuration: formData.estimatedDuration
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
        showAlert(`Entry failed: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Entry error:', error);
      showAlert('Entry failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.eventId) {
      showAlert('Please select an event first', 'warning');
      return;
    }
    if (step === 2 && formData.participantIds.length === 0) {
      showAlert('Please select participants', 'warning');
      return;
    }
    if (step === 2 && !formData.itemName) {
      showAlert('Please fill in all performance details', 'warning');
      return;
    }
    if (step === 2 && !validateDuration(formData.estimatedDuration)) {
      const maxTime = getTimeLimit();
      const maxTimeDisplay = maxTime === 3.5 ? '3:30' : `${maxTime}:00`;
      showAlert(`⏰ Duration too long! ${performanceType} performances must be ${maxTimeDisplay} minutes or less. Current: ${formData.estimatedDuration} minutes.`, 'warning');
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
          
          {/* Fee Summary in Success */}
          {formData.mastery && formData.participantIds.length > 0 && (() => {
            const feeBreakdown = calculateEODSAFee(
              formData.mastery,
              performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
              formData.participantIds.length
            );
            return (
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/40 rounded-2xl p-6 mb-6">
                <p className="text-lg font-bold text-green-300 mb-4">📧 Expect an Email Invoice for:</p>
                <p className="text-3xl font-bold text-green-100">R{feeBreakdown.totalFee.toFixed(2)}</p>
                <p className="text-sm text-green-400 mt-2">Gabriel's team will send payment instructions via email</p>
              </div>
            );
          })()}
          
          <div className="bg-blue-900/30 border border-blue-500/40 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-300 mb-2">Payment Instructions</p>
            <p className="text-blue-200 text-sm">Check your email for Yoco card payment link or EFT details</p>
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
              <span>Fees</span>
              <span>Submit</span>
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
                    </label>
                    
                    {/* Time Limit Information */}
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-yellow-300 font-semibold">EODSA Max Time Limits</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="bg-yellow-900/30 p-2 rounded">
                          <div className="text-yellow-200 font-medium">Solos</div>
                          <div className="text-yellow-100 text-lg">2:00 mins</div>
                        </div>
                        <div className="bg-yellow-900/30 p-2 rounded">
                          <div className="text-yellow-200 font-medium">Duos/Trios</div>
                          <div className="text-yellow-100 text-lg">3:00 mins</div>
                        </div>
                        <div className="bg-yellow-900/30 p-2 rounded">
                          <div className="text-yellow-200 font-medium">Groups</div>
                          <div className="text-yellow-100 text-lg">3:30 mins</div>
                        </div>
                      </div>
                                             <div className="mt-3 p-2 bg-yellow-900/40 rounded text-center">
                         <span className="text-yellow-100 font-bold">
                           Your {performanceType} limit: {getTimeLimit() === 3.5 ? '3:30' : `${getTimeLimit()}:00`} minutes
                         </span>
                       </div>
                    </div>

                    <input
                      type="number"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleInputChange}
                      min="0.5"
                      max={getTimeLimit() || 10}
                      step="0.1"
                      placeholder={`Maximum ${getTimeLimit() === 3.5 ? '3:30' : getTimeLimit()} minutes`}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 text-white placeholder-gray-400 transition-all ${
                        validateDuration(formData.estimatedDuration) 
                          ? 'border-gray-600 bg-gray-700 focus:ring-purple-500 focus:border-purple-500' 
                          : 'border-red-500 bg-red-900/30 focus:ring-red-500 focus:border-red-500'
                      }`}
                      required
                    />
                    
                    {/* Validation Messages */}
                    {!validateDuration(formData.estimatedDuration) && formData.estimatedDuration > 0 && (
                      <div className="mt-3 p-3 bg-red-900/30 border border-red-500/40 rounded-lg">
                        <p className="text-red-300 text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Duration too long!
                        </p>
                                                 <p className="text-red-200 text-sm mt-1">
                           <strong>{performanceType} performances</strong> cannot exceed <strong>{getTimeLimit() === 3.5 ? '3:30' : `${getTimeLimit()}:00`} minutes</strong>.
                           <br />Your current duration: <strong>{formData.estimatedDuration} minutes</strong>
                         </p>
                      </div>
                    )}
                    
                    {validateDuration(formData.estimatedDuration) && formData.estimatedDuration > 0 && (
                      <p className="text-green-400 text-sm mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                                                 Perfect! Duration is within the {getTimeLimit() === 3.5 ? '3:30' : `${getTimeLimit()}:00`} minute limit
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Fee Preview */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Fee Preview</h2>
                
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30 rounded-2xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-purple-300 mb-4">💰 EODSA Fee Breakdown</h3>
                  {formData.mastery && formData.participantIds.length > 0 && (() => {
                    const feeBreakdown = calculateEODSAFee(
                      formData.mastery,
                      performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
                      formData.participantIds.length
                    );
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-purple-200 text-lg">
                          <span>Registration Fee ({formData.participantIds.length} participant{formData.participantIds.length > 1 ? 's' : ''})</span>
                          <span className="font-semibold">R{feeBreakdown.registrationFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-purple-200 text-lg">
                          <span>Performance Fee ({performanceType})</span>
                          <span className="font-semibold">R{feeBreakdown.performanceFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-purple-400/30 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-purple-100">Total Amount Due:</span>
                            <span className="text-3xl font-bold text-green-300">R{feeBreakdown.totalFee.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="bg-purple-900/30 rounded-lg p-3 mt-4">
                          <div className="text-sm text-purple-300">
                            <p><strong>Mastery Level:</strong> {formData.mastery}</p>
                            <p><strong>Performance Type:</strong> {performanceType}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Payment Information
                  </h3>
                  <div className="text-blue-200 space-y-2">
                    <p>After submitting your entry, Gabriel's team will send you an email invoice with:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Yoco card payment</strong> - Pay online with any card</li>
                      <li><strong>EFT details</strong> - For direct bank transfer</li>
                    </ul>
                    <p className="text-sm text-blue-300 mt-3 bg-blue-900/30 p-3 rounded-lg">
                      <strong>No payment is required now.</strong> Complete payment after receiving your invoice.
                    </p>
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
                    </div>
                  </div>

                  {/* Fee Summary */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-purple-300 mb-4">💰 Fee Summary</h3>
                    {formData.mastery && formData.participantIds.length > 0 && (() => {
                      const feeBreakdown = calculateEODSAFee(
                        formData.mastery,
                        performanceType as 'Solo' | 'Duet' | 'Trio' | 'Group',
                        formData.participantIds.length
                      );
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between text-purple-200 text-lg">
                            <span>Registration Fee ({formData.participantIds.length} participant{formData.participantIds.length > 1 ? 's' : ''})</span>
                            <span className="font-semibold">R{feeBreakdown.registrationFee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-purple-200 text-lg">
                            <span>Performance Fee ({performanceType})</span>
                            <span className="font-semibold">R{feeBreakdown.performanceFee.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-purple-400/30 pt-3 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-purple-100">Total Amount Due:</span>
                              <span className="text-3xl font-bold text-green-300">R{feeBreakdown.totalFee.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Information (Phase 1) */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 003 3z" />
                      </svg>
                      How to Pay
                    </h3>
                    <div className="text-blue-200 space-y-3">
                      <p>After you click <strong>"Submit Entries"</strong>, you'll receive an email invoice with:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>A link to pay by card (Yoco)</li>
                        <li>Our bank details for EFT</li>
                      </ul>
                      <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg p-3 mt-4">
                        <p className="text-sm text-blue-300">
                          <strong>⏰ Important:</strong> Please complete payment before the entry deadline.
                        </p>
                      </div>
                    </div>
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
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Submitting Entries...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Entries
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
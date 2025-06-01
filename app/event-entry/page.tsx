'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { REGIONS, PERFORMANCE_TYPES, AGE_CATEGORIES } from '@/lib/types';

interface EventEntryForm {
  eodsaId: string;
  eventId: string;
  region: string;
  performanceType: string;
  participantIds: string[];
  ageCategory: string;
  paymentMethod: 'credit_card' | 'bank_transfer';
  itemName: string;
  choreographer: string;
  mastery: string;
  itemStyle: string;
  estimatedDuration: number;
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

// Mastery levels for EODSA competitions
const MASTERY_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Open',
  'Professional'
];

// More specific item styles for EODSA
const ITEM_STYLES = [
  'Ballet - Classical Variation',
  'Ballet - Contemporary Ballet',
  'Ballet - Demi Character',
  'Contemporary - Lyrical',
  'Contemporary - Modern',
  'Jazz - Commercial',
  'Jazz - Musical Theatre',
  'Jazz - Funk',
  'Hip Hop - Old School',
  'Hip Hop - New School',
  'Hip Hop - Commercial',
  'Tap - Traditional',
  'Tap - Contemporary',
  'Musical Theatre',
  'Commercial Dance',
  'Acrobatic Dance',
  'Cultural/Traditional',
  'Other'
];

export default function EventEntryPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<EventEntryForm>({
    eodsaId: searchParams?.get('eodsaId') || '',
    eventId: '',
    region: '',
    performanceType: '',
    participantIds: [],
    ageCategory: '',
    paymentMethod: 'credit_card',
    itemName: '',
    choreographer: '',
    mastery: '',
    itemStyle: '',
    estimatedDuration: 3
  });
  
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Load contestant data when E-O-D-S-A ID is provided
  useEffect(() => {
    if (formData.eodsaId) {
      loadContestant(formData.eodsaId);
    }
  }, [formData.eodsaId]);

  // Filter available events when contestant data changes
  useEffect(() => {
    if (contestant && events.length > 0) {
      filterAvailableEvents();
    }
  }, [contestant, events]);

  // Calculate fee when event is selected
  useEffect(() => {
    if (formData.eventId) {
      const selectedEvent = events.find(e => e.id === formData.eventId);
      if (selectedEvent) {
        setCalculatedFee(selectedEvent.entryFee);
        // Auto-populate fields from selected event
        setFormData(prev => ({
          ...prev,
          region: selectedEvent.region,
          ageCategory: selectedEvent.ageCategory,
          performanceType: selectedEvent.performanceType
        }));
      }
    }
  }, [formData.eventId, events]);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter to only show events that are open for registration
          const openEvents = data.events.filter((event: Event) => 
            event.status === 'registration_open' || event.status === 'upcoming'
          );
          setEvents(openEvents);
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const filterAvailableEvents = () => {
    if (!contestant) return;
    
    // For now, show all open events
    // In the future, you might want to filter based on contestant's dancer ages, etc.
    setAvailableEvents(events);
  };

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
        eventId: formData.eventId,
        contestantId: contestant!.id,
        eodsaId: formData.eodsaId,
        participantIds: formData.participantIds,
        calculatedFee,
        paymentStatus: 'pending',
        paymentMethod: formData.paymentMethod,
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
              {(() => {
                const selectedEvent = events.find(e => e.id === formData.eventId);
                return selectedEvent ? (
                  <>
                    <p className="text-sm text-blue-900">{selectedEvent.name}</p>
                    <p className="text-sm text-blue-900">{selectedEvent.region} - {selectedEvent.performanceType} ({selectedEvent.ageCategory})</p>
              <p className="text-lg font-bold text-blue-900">Fee: R{calculatedFee.toFixed(2)}</p>
                  </>
                ) : (
                  <p className="text-sm text-blue-900">Event details not available</p>
                );
              })()}
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
                {/* Event Selection */}
                <div>
                  <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Event *
                  </label>
                  <select
                    id="eventId"
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose an event to enter</option>
                    {availableEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {event.region} - {event.performanceType} ({event.ageCategory}) - R{event.entryFee}
                      </option>
                    ))}
                  </select>
                  {formData.eventId && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      {(() => {
                        const selectedEvent = availableEvents.find(e => e.id === formData.eventId);
                        return selectedEvent ? (
                          <div className="text-sm">
                            <p><strong>Event:</strong> {selectedEvent.name}</p>
                            <p><strong>Date:</strong> {new Date(selectedEvent.eventDate).toLocaleDateString()}</p>
                            <p><strong>Venue:</strong> {selectedEvent.venue}</p>
                            <p><strong>Registration Deadline:</strong> {new Date(selectedEvent.registrationDeadline).toLocaleDateString()}</p>
                            <p><strong>Entry Fee:</strong> R{selectedEvent.entryFee.toFixed(2)}</p>
                          </div>
                        ) : null;
                      })()}
                </div>
                  )}
                </div>

                {/* Participant Selection */}
                {formData.eventId && (
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

                {/* Item Name */}
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="Enter item name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Choreographer */}
                <div>
                  <label htmlFor="choreographer" className="block text-sm font-medium text-gray-700 mb-2">
                    Choreographer *
                  </label>
                  <input
                    type="text"
                    id="choreographer"
                    name="choreographer"
                    value={formData.choreographer}
                    onChange={handleInputChange}
                    placeholder="Enter choreographer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Mastery */}
                <div>
                  <label htmlFor="mastery" className="block text-sm font-medium text-gray-700 mb-2">
                    Mastery *
                  </label>
                  <select
                    id="mastery"
                    name="mastery"
                    value={formData.mastery}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select mastery level</option>
                    {MASTERY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Item Style */}
                <div>
                  <label htmlFor="itemStyle" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Style *
                  </label>
                  <select
                    id="itemStyle"
                    name="itemStyle"
                    value={formData.itemStyle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select item style</option>
                    {ITEM_STYLES.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Estimated Duration */}
                <div>
                  <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration *
                  </label>
                  <input
                    type="number"
                    id="estimatedDuration"
                    name="estimatedDuration"
                    value={formData.estimatedDuration}
                    onChange={handleInputChange}
                    placeholder="Enter estimated duration in minutes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Fee Display */}
                {calculatedFee > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Entry Fee</h3>
                    <p className="text-2xl font-bold text-blue-900">R{calculatedFee.toFixed(2)}</p>
                    {(() => {
                      const selectedEvent = events.find(e => e.id === formData.eventId);
                      return selectedEvent ? (
                    <p className="text-sm text-blue-700">
                          {selectedEvent.region} - {selectedEvent.performanceType} ({selectedEvent.ageCategory})
                    </p>
                      ) : null;
                    })()}
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
                      <div className="flex items-center justify-center space-x-3">
                        <div className="relative w-5 h-5">
                          <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                        </div>
                        <span>Submitting...</span>
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
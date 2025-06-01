'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PERFORMANCE_TYPES } from '@/lib/types';

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

export default function RegionalEventsPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const region = params?.region as string;
  const eodsaId = searchParams?.get('eodsaId') || '';
  
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPerformanceType, setSelectedPerformanceType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (region && eodsaId) {
      loadContestant(eodsaId);
      loadRegionalEvents();
    }
  }, [region, eodsaId]);

  const loadContestant = async (id: string) => {
    try {
      const response = await fetch(`/api/contestants/by-eodsa-id/${id}`);
      if (response.ok) {
        const data = await response.json();
        setContestant(data);
      }
    } catch (error) {
      console.error('Failed to load contestant:', error);
    }
  };

  const loadRegionalEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter events by region and open status
          const regionEvents = data.events.filter((event: Event) => 
            event.region.toLowerCase() === region?.toLowerCase() &&
            (event.status === 'registration_open' || event.status === 'upcoming')
          );
          setEvents(regionEvents);
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPerformanceType = (performanceType: string) => {
    setSelectedPerformanceType(performanceType);
    // Find events that match this performance type
    const matchingEvents = events.filter(event => event.performanceType === performanceType);
    if (matchingEvents.length > 0) {
      // Navigate to event entry with specific event
      router.push(`/event-dashboard/${region}/${performanceType.toLowerCase()}?eodsaId=${eodsaId}`);
    }
  };

  const getEventsByPerformanceType = (performanceType: string) => {
    return events.filter(event => event.performanceType === performanceType);
  };

  const getParticipantRequirements = (performanceType: string) => {
    switch (performanceType) {
      case 'Solo': return { min: 1, max: 1, description: 'Individual performance' };
      case 'Duet': return { min: 2, max: 2, description: 'Two dancers together' };
      case 'Trio': return { min: 3, max: 3, description: 'Three dancers together' };
      case 'Group': return { min: 4, max: 30, description: '4+ dancers together' };
      default: return { min: 1, max: 1, description: 'Performance' };
    }
  };

  if (!region || !eodsaId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Missing Information</h2>
          <p className="text-gray-700 mb-6">Region or EODSA ID not provided.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href={`/event-dashboard?eodsaId=${eodsaId}`} 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {region?.charAt(0).toUpperCase() + region?.slice(1)} Events
          </h1>
          <p className="text-xl text-gray-700">Select your performance type to continue</p>
        </div>

        {/* User Info */}
        {contestant && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">{contestant.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{contestant.name}</h3>
                  <p className="text-sm text-purple-700 font-mono">EODSA ID: {contestant.eodsaId}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-sm font-medium">
                    {region} Region
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Type Selection - Matches Flowchart */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Performance Type</h2>
              <p className="text-gray-700">Choose the type of performance you want to register for</p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-700">Loading events...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PERFORMANCE_TYPES.map((performanceType) => {
                  const requirements = getParticipantRequirements(performanceType);
                  const availableEvents = getEventsByPerformanceType(performanceType);
                  const hasEvents = availableEvents.length > 0;
                  
                  return (
                    <div
                      key={performanceType}
                      onClick={hasEvents ? () => selectPerformanceType(performanceType) : undefined}
                      className={`border-2 rounded-2xl p-6 transition-all duration-300 ${
                        hasEvents 
                          ? 'border-gray-200 hover:border-purple-400 hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:shadow-lg' 
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          hasEvents 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                            : 'bg-gray-300'
                        }`}>
                          <span className="text-white text-2xl">
                            {performanceType === 'Solo' ? '🕺' : 
                             performanceType === 'Duet' ? '👫' : 
                             performanceType === 'Trio' ? '👥' : '🎭'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{performanceType}</h3>
                        <p className="text-gray-700 mb-4 text-sm">{requirements.description}</p>
                        
                        <div className="space-y-2">
                          <div className={`rounded-lg p-3 ${hasEvents ? 'bg-purple-50' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-semibold ${hasEvents ? 'text-purple-700' : 'text-gray-600'}`}>
                              Participants: {requirements.min === requirements.max ? requirements.min : `${requirements.min}-${requirements.max}`}
                            </p>
                          </div>
                          
                          <div className={`rounded-lg p-3 ${hasEvents ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-semibold ${hasEvents ? 'text-emerald-700' : 'text-gray-600'}`}>
                              {availableEvents.length} {availableEvents.length === 1 ? 'Event' : 'Events'} Available
                            </p>
                            {hasEvents && (
                              <p className="text-xs text-emerald-700 mt-1">Click to view events</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Region Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-emerald-600">{events.length}</div>
                <div className="text-sm text-emerald-700">Total Events</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-purple-600">{events.filter(e => e.performanceType === 'Solo').length}</div>
                <div className="text-sm text-purple-700">Solo Events</div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-blue-600">{events.filter(e => ['Duet', 'Trio'].includes(e.performanceType)).length}</div>
                <div className="text-sm text-blue-700">Duet/Trio Events</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-orange-600">{events.filter(e => e.performanceType === 'Group').length}</div>
                <div className="text-sm text-orange-700">Group Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
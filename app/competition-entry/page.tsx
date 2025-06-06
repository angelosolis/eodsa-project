'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { REGIONS, PERFORMANCE_TYPES, AGE_CATEGORIES } from '@/lib/types';

interface Dancer {
  id: string;
  eodsaId: string;
  name: string;
  age: number;
  dateOfBirth: string;
  nationalId: string;
  email?: string;
  phone?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface StudioApplication {
  id: string;
  studioId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  respondedAt?: string;
  studio: {
    name: string;
    email: string;
    address: string;
  };
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

export default function CompetitionEntry() {
  const router = useRouter();
  const [dancer, setDancer] = useState<Dancer | null>(null);
  const [studioApplications, setStudioApplications] = useState<StudioApplication[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [eodsaId, setEodsaId] = useState('');
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    // Check session
    const session = localStorage.getItem('dancerSession');
    if (session) {
      const data = JSON.parse(session);
      loadDancerData(data.eodsaId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadDancerData = async (id: string) => {
    try {
      const response = await fetch(`/api/dancers/by-eodsa-id/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDancer(data.dancer);
        loadEvents();
      } else {
        setError('Dancer not found');
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events?.filter((e: Event) => e.status !== 'completed') || []);
      }
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eodsaId.trim()) {
      setIsLoading(true);
      await loadDancerData(eodsaId.trim());
    }
  };

  // Check dancer eligibility
  const getDancerStatus = () => {
    if (!dancer) return { eligible: false, reason: 'Not logged in' };
    
    if (dancer.rejectionReason) {
      return { 
        eligible: false, 
        reason: 'Account disabled', 
        message: 'Your account has been disabled. Please contact support for assistance.' 
      };
    }

    const acceptedApplications = studioApplications.filter(app => app.status === 'accepted');
    
    return {
      eligible: true,
      reason: 'Active',
      isIndependent: acceptedApplications.length === 0,
      studioAffiliation: acceptedApplications.length > 0 ? acceptedApplications[0].studio.name : null
    };
  };

  const status = getDancerStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dancer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-center mb-6">Competition Entry</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EODSA ID</label>
                <input
                  type="text"
                  value={eodsaId}
                  onChange={(e) => setEodsaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your EODSA ID"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Access Portal
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/register" className="text-indigo-600 hover:underline">
                Register as New Dancer
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Competition Portal - {dancer.name}</h1>
            <button
              onClick={() => {
                localStorage.removeItem('dancerSession');
                router.push('/');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Competition Eligibility</h2>
            {status.eligible ? (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <p className="text-green-700 font-semibold text-lg">✅ Eligible for Competition Entry</p>
                <p className="text-green-600 mt-2">You are approved and can enter competitions</p>
              </div>
            ) : (
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                <p className="text-orange-700 font-semibold text-lg">⏳ Pending Admin Approval</p>
                <p className="text-orange-600 mt-2">
                  {dancer.rejectionReason 
                    ? `Registration rejected: ${dancer.rejectionReason}` 
                    : 'Your registration is pending admin approval'
                  }
                </p>
                <Link 
                  href="/dancer-dashboard"
                  className="inline-block mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Check Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>

        {status.eligible && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-bold">Available Competitions</h2>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No competitions available at this time</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>📅 {new Date(event.eventDate).toLocaleDateString()}</p>
                      <p>📍 {event.venue}</p>
                      <p>🎭 {event.performanceType}</p>
                      <p>👥 {event.ageCategory}</p>
                      <p>💰 R{event.entryFee}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/event-entry?eventId=${event.id}&dancerId=${dancer.id}`)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Enter Competition
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
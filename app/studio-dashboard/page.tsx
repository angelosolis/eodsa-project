'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Studio session interface
interface StudioSession {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
}

// Accepted dancer interface  
interface AcceptedDancer {
  id: string;
  eodsaId: string;
  name: string;
  age: number;
  dateOfBirth: string;
  nationalId: string;
  email?: string;
  phone?: string;
  joinedAt: string;
}

// Competition entry interface
interface CompetitionEntry {
  id: string;
  eventName: string;
  participantName: string;
  status: string;
  submittedAt: string;
}

export default function StudioDashboardPage() {
  const [studioSession, setStudioSession] = useState<StudioSession | null>(null);
  const [acceptedDancers, setAcceptedDancers] = useState<AcceptedDancer[]>([]);
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'dancers' | 'entries'>('dancers');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDancerModal, setShowAddDancerModal] = useState(false);
  const [addDancerEodsaId, setAddDancerEodsaId] = useState('');
  const [addingDancer, setAddingDancer] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check for studio session
    const session = localStorage.getItem('studioSession');
    if (!session) {
      router.push('/studio-login');
      return;
    }

    const parsedSession = JSON.parse(session);
    setStudioSession(parsedSession);
    loadData(parsedSession.id);
  }, [router]);

  const loadData = async (studioId: string) => {
    try {
      setIsLoading(true);
      
      // Load accepted dancers and competition entries
      const [dancersResponse] = await Promise.all([
        fetch(`/api/studios/dancers-new?studioId=${studioId}`)
        // TODO: Add competition entries API call when ready
        // fetch(`/api/studios/entries?studioId=${studioId}`)
      ]);

      const dancersData = await dancersResponse.json();

      if (dancersData.success) {
        setAcceptedDancers(dancersData.dancers);
      } else {
        setError(dancersData.error || 'Failed to load dancers');
      }

      // TODO: Load competition entries when API is ready
      setCompetitionEntries([]);
    } catch (error) {
      console.error('Load data error:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDancer = async () => {
    if (!studioSession || !addDancerEodsaId.trim()) return;

    try {
      setAddingDancer(true);
      setError('');

      const response = await fetch('/api/studios/add-dancer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studioSession.id,
          eodsaId: addDancerEodsaId.trim().toUpperCase(),
          addedBy: studioSession.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddDancerModal(false);
        setAddDancerEodsaId('');
        setSuccessMessage(`Dancer ${addDancerEodsaId.trim().toUpperCase()} has been successfully added to your studio!`);
        // Reload data to reflect changes
        loadData(studioSession.id);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to add dancer');
      }
    } catch (error) {
      console.error('Add dancer error:', error);
      setError('Failed to add dancer');
    } finally {
      setAddingDancer(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studioSession');
    router.push('/studio-login');
  };

  // Calculate studio metrics
  const getStudioStats = () => {
    const totalDancers = acceptedDancers.length;
    const totalEntries = competitionEntries.length;
    const avgAge = totalDancers > 0 
      ? Math.round(acceptedDancers.reduce((sum, dancer) => sum + dancer.age, 0) / totalDancers)
      : 0;
    const recentJoins = acceptedDancers.filter(dancer => {
      const joinDate = new Date(dancer.joinedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinDate > thirtyDaysAgo;
    }).length;

    return { totalDancers, totalEntries, avgAge, recentJoins };
  };

  const stats = getStudioStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading studio dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studioSession) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {studioSession.name}
              </h1>
              <p className="text-gray-400 text-sm">
                Registration: {studioSession.registrationNumber} | Email: {studioSession.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Studio Dashboard</h2>
          <p className="text-gray-300">Manage your dancers and competition entries</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-300 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-300">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage('')}
              className="text-green-400 hover:text-green-300 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Total Dancers</h3>
                <p className="text-3xl font-bold text-purple-400">{stats.totalDancers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Competition Entries</h3>
                <p className="text-3xl font-bold text-green-400">{stats.totalEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Average Age</h3>
                <p className="text-3xl font-bold text-blue-400">{stats.avgAge || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Joins</h3>
                <p className="text-3xl font-bold text-orange-400">{stats.recentJoins}</p>
                <p className="text-xs text-gray-400">Last 30 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800/80 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dancers')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'dancers'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              My Dancers ({acceptedDancers.length})
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'entries'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              My Entries ({stats.totalEntries})
            </button>
          </div>
        </div>

        {/* Dancers Tab */}
        {activeTab === 'dancers' && (
          <div className="bg-gray-800/80 rounded-2xl border border-gray-700/20 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">My Dancers</h3>
                  <p className="text-gray-400 text-sm mt-1">Dancers who are part of your studio</p>
                </div>
                <button
                  onClick={() => setShowAddDancerModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Dancer by EODSA ID</span>
                </button>
              </div>
            </div>

            {acceptedDancers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">No dancers in your studio yet</p>
                <p className="text-gray-500 text-sm">Accept applications to build your dance team</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {acceptedDancers.map((dancer) => (
                  <div key={dancer.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <h4 className="text-lg font-semibold text-white mr-3">{dancer.name}</h4>
                          <span className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm font-medium">
                            Age {dancer.age}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">EODSA ID:</span>
                            <span className="text-white ml-2 font-mono">{dancer.eodsaId}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">National ID:</span>
                            <span className="text-white ml-2 font-mono">{dancer.nationalId}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Joined:</span>
                            <span className="text-white ml-2">{new Date(dancer.joinedAt).toLocaleDateString()}</span>
                          </div>
                          {dancer.email && (
                            <div>
                              <span className="text-gray-400">Email:</span>
                              <span className="text-white ml-2">{dancer.email}</span>
                            </div>
                          )}
                          {dancer.phone && (
                            <div>
                              <span className="text-gray-400">Phone:</span>
                              <span className="text-white ml-2">{dancer.phone}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Date of Birth:</span>
                            <span className="text-white ml-2">{new Date(dancer.dateOfBirth).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/event-dashboard?eodsaId=${dancer.eodsaId}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Enter Competitions
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Entries Tab */}
        {activeTab === 'entries' && (
          <div className="bg-gray-800/80 rounded-2xl border border-gray-700/20 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Competition Entries</h3>
                  <p className="text-gray-400 text-sm mt-1">View and manage competition entries for your dancers</p>
                </div>
                <Link
                  href="/event-dashboard"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Entry</span>
                </Link>
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">Entry management coming soon</p>
              <p className="text-gray-500 text-sm mb-6">
                Competition entries will appear here once your dancers register for events.
                For now, use each dancer's EODSA ID to enter competitions directly.
              </p>
              
              <div className="max-w-md mx-auto space-y-3">
                <h4 className="text-white font-medium">Quick Entry Access:</h4>
                {acceptedDancers.slice(0, 3).map((dancer) => (
                  <Link
                    key={dancer.id}
                    href={`/event-dashboard?eodsaId=${dancer.eodsaId}`}
                    className="block p-3 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{dancer.name}</span>
                      <span className="text-gray-400 text-sm font-mono">{dancer.eodsaId}</span>
                    </div>
                  </Link>
                ))}
                {acceptedDancers.length > 3 && (
                  <p className="text-gray-500 text-sm">+ {acceptedDancers.length - 3} more dancers</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Dancer Modal */}
        {showAddDancerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Add Dancer by EODSA ID</h3>
              <p className="text-gray-300 mb-4">Enter the EODSA ID of a registered dancer to add them directly to your studio:</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  EODSA ID (e.g., E123456)
                </label>
                <input
                  type="text"
                  value={addDancerEodsaId}
                  onChange={(e) => setAddDancerEodsaId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400 font-mono"
                  placeholder="E123456"
                  maxLength={7}
                  pattern="E\d{6}"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Format: E followed by 6 digits
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleAddDancer}
                  disabled={!addDancerEodsaId.trim() || addingDancer}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addingDancer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Dancer'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddDancerModal(false);
                    setAddDancerEodsaId('');
                    setError('');
                  }}
                  disabled={addingDancer}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
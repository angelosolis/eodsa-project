'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MASTERY_LEVELS, ITEM_STYLES } from '@/lib/types';

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

// Edit dancer interface
interface EditDancerData {
  name: string;
  dateOfBirth: string;
  nationalId: string;
  email?: string;
  phone?: string;
}

// Competition entry interface
interface CompetitionEntry {
  id: string;
  eventId: string;
  eventName: string;
  region: string;
  eventDate: string;
  venue: string;
  performanceType: string;
  contestantId: string;
  contestantName: string;
  contestantType: string;
  eodsaId: string;
  participantIds: string[];
  participantNames: string[];
  calculatedFee: number;
  paymentStatus: string;
  paymentMethod?: string;
  submittedAt: string;
  approved: boolean;
  qualifiedForNationals: boolean;
  itemNumber?: number;
  itemName: string;
  choreographer: string;
  mastery: string;
  itemStyle: string;
  estimatedDuration: number;
  createdAt: string;
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
  
  // Edit dancer state
  const [showEditDancerModal, setShowEditDancerModal] = useState(false);
  const [editingDancer, setEditingDancer] = useState<AcceptedDancer | null>(null);
  const [editDancerData, setEditDancerData] = useState<EditDancerData>({
    name: '',
    dateOfBirth: '',
    nationalId: '',
    email: '',
    phone: ''
  });
  const [isEditingDancer, setIsEditingDancer] = useState(false);
  
  // Edit entry state
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CompetitionEntry | null>(null);
  const [editEntryData, setEditEntryData] = useState({
    itemName: '',
    choreographer: '',
    mastery: '',
    itemStyle: '',
    estimatedDuration: 0
  });
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  
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
      const [dancersResponse, entriesResponse] = await Promise.all([
        fetch(`/api/studios/dancers-new?studioId=${studioId}`),
        fetch(`/api/studios/entries?studioId=${studioId}`)
      ]);

      const dancersData = await dancersResponse.json();
      const entriesData = await entriesResponse.json();

      if (dancersData.success) {
        setAcceptedDancers(dancersData.dancers);
      } else {
        setError(dancersData.error || 'Failed to load dancers');
      }

      if (entriesData.success) {
        setCompetitionEntries(entriesData.entries);
      } else {
        console.error('Failed to load entries:', entriesData.error);
        setCompetitionEntries([]);
      }
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

  const handleEditDancer = (dancer: AcceptedDancer) => {
    setEditingDancer(dancer);
    setEditDancerData({
      name: dancer.name,
      dateOfBirth: dancer.dateOfBirth,
      nationalId: dancer.nationalId,
      email: dancer.email || '',
      phone: dancer.phone || ''
    });
    setShowEditDancerModal(true);
  };

  const handleUpdateDancer = async () => {
    if (!studioSession || !editingDancer) return;

    try {
      setIsEditingDancer(true);
      setError('');

      const response = await fetch('/api/studios/edit-dancer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studioSession.id,
          dancerId: editingDancer.id,
          ...editDancerData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditDancerModal(false);
        setEditingDancer(null);
        setSuccessMessage(`Dancer ${editDancerData.name} has been successfully updated!`);
        // Reload data to reflect changes
        loadData(studioSession.id);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to update dancer');
      }
    } catch (error) {
      console.error('Update dancer error:', error);
      setError('Failed to update dancer');
    } finally {
      setIsEditingDancer(false);
    }
  };

  const handleDeleteDancer = async (dancer: AcceptedDancer) => {
    if (!studioSession) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${dancer.name} (${dancer.eodsaId}) from your studio? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch('/api/studios/remove-dancer', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studioSession.id,
          dancerId: dancer.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Dancer ${dancer.name} has been removed from your studio.`);
        // Reload data to reflect changes
        loadData(studioSession.id);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to remove dancer');
      }
    } catch (error) {
      console.error('Remove dancer error:', error);
      setError('Failed to remove dancer');
    }
  };

  // Entry management functions
  const handleEditEntry = (entry: CompetitionEntry) => {
    setEditingEntry(entry);
    setEditEntryData({
      itemName: entry.itemName,
      choreographer: entry.choreographer,
      mastery: entry.mastery,
      itemStyle: entry.itemStyle,
      estimatedDuration: entry.estimatedDuration
    });
    setShowEditEntryModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!studioSession || !editingEntry) return;

    try {
      setIsEditingEntry(true);
      setError('');

      const response = await fetch(`/api/studios/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studioSession.id,
          ...editEntryData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditEntryModal(false);
        setEditingEntry(null);
        setSuccessMessage(`Entry "${editEntryData.itemName}" has been successfully updated!`);
        // Reload data to reflect changes
        loadData(studioSession.id);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Update entry error:', error);
      setError('Failed to update entry');
    } finally {
      setIsEditingEntry(false);
    }
  };

  const handleDeleteEntry = async (entry: CompetitionEntry) => {
    if (!studioSession) return;

    const confirmed = window.confirm(
      `Are you sure you want to withdraw the entry "${entry.itemName}" for ${entry.eventName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(`/api/studios/entries/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studioSession.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Entry "${entry.itemName}" has been withdrawn successfully.`);
        // Reload data to reflect changes
        loadData(studioSession.id);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to withdraw entry');
      }
    } catch (error) {
      console.error('Delete entry error:', error);
      setError('Failed to withdraw entry');
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

  // Get unique events count
  const getUniqueEventsCount = () => {
    const uniqueEvents = new Set(competitionEntries.map(entry => entry.eventId));
    return uniqueEvents.size;
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
                        <button
                          onClick={() => handleEditDancer(dancer)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDancer(dancer)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
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

            {competitionEntries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
                <p className="text-gray-400 mb-2">No competition entries yet</p>
              <p className="text-gray-500 text-sm mb-6">
                  Your dancers haven't entered any competitions yet. Use the buttons below to get started.
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
            ) : (
              <div className="divide-y divide-gray-700">
                {competitionEntries.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <h4 className="text-lg font-semibold text-white mr-3">{entry.itemName}</h4>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            entry.approved 
                              ? 'bg-green-900/30 text-green-300' 
                              : 'bg-yellow-900/30 text-yellow-300'
                          }`}>
                            {entry.approved ? 'Approved' : 'Pending Approval'}
                          </span>
                          {entry.itemNumber && (
                            <span className="ml-2 px-3 py-1 bg-purple-900/30 text-purple-300 text-sm font-medium rounded-full">
                              Item #{entry.itemNumber}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-400">Event:</span>
                            <span className="text-white ml-2">{entry.eventName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white ml-2">{new Date(entry.eventDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Region:</span>
                            <span className="text-white ml-2">{entry.region}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Performance Type:</span>
                            <span className="text-white ml-2">{entry.performanceType}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Style:</span>
                            <span className="text-white ml-2">{entry.itemStyle}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Mastery:</span>
                            <span className="text-white ml-2">{entry.mastery}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Choreographer:</span>
                            <span className="text-white ml-2">{entry.choreographer}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white ml-2">{entry.estimatedDuration} min</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Fee:</span>
                            <span className="text-white ml-2">R{entry.calculatedFee.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="text-gray-400">Participants:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {entry.participantNames.map((name, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-900/30 text-purple-300 text-sm rounded-full">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Submitted: {new Date(entry.submittedAt).toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                <button
                          onClick={() => handleEditEntry(entry)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                          Edit
                </button>
                <button
                          onClick={() => handleDeleteEntry(entry)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Withdraw
                </button>
              </div>
            </div>
                  </div>
                ))}
              </div>
            )}
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

        {/* Edit Dancer Modal */}
        {showEditDancerModal && editingDancer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Edit Dancer: {editingDancer.name}</h3>
              <p className="text-gray-300 mb-6">Update dancer information below:</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editDancerData.name}
                    onChange={(e) => setEditDancerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={editDancerData.dateOfBirth}
                    onChange={(e) => setEditDancerData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    National ID *
                  </label>
                  <input
                    type="text"
                    value={editDancerData.nationalId}
                    onChange={(e) => setEditDancerData(prev => ({ ...prev, nationalId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400 font-mono"
                    maxLength={13}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={editDancerData.email}
                    onChange={(e) => setEditDancerData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    placeholder="dancer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={editDancerData.phone}
                    onChange={(e) => setEditDancerData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    placeholder="+27 123 456 7890"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleUpdateDancer}
                  disabled={!editDancerData.name.trim() || !editDancerData.dateOfBirth || !editDancerData.nationalId.trim() || isEditingDancer}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isEditingDancer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Dancer'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEditDancerModal(false);
                    setEditingDancer(null);
                    setError('');
                  }}
                  disabled={isEditingDancer}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {showEditEntryModal && editingEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Edit Entry: {editingEntry.itemName}</h3>
              <p className="text-gray-300 mb-6">Update entry details below:</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={editEntryData.itemName}
                    onChange={(e) => setEditEntryData(prev => ({ ...prev, itemName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    placeholder="e.g., Swan Lake Variation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Choreographer *
                  </label>
                  <input
                    type="text"
                    value={editEntryData.choreographer}
                    onChange={(e) => setEditEntryData(prev => ({ ...prev, choreographer: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    placeholder="e.g., Ms. Johnson"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mastery Level *
                  </label>
                  <select
                    value={editEntryData.mastery}
                    onChange={(e) => setEditEntryData(prev => ({ ...prev, mastery: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
                    required
                  >
                    <option value="">Select Mastery Level</option>
                    {MASTERY_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Item Style *
                  </label>
                  <select
                    value={editEntryData.itemStyle}
                    onChange={(e) => setEditEntryData(prev => ({ ...prev, itemStyle: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
                    required
                  >
                    <option value="">Select Style</option>
                    {ITEM_STYLES.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Duration (minutes) *
                    <span className="text-purple-400 ml-2 text-xs">
                      (Max: Solo-2min, Duet/Trio-3min, Group-3:30)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    max={3.5}
                    step={0.5}
                    value={editEntryData.estimatedDuration}
                    onChange={(e) => setEditEntryData(prev => ({ ...prev, estimatedDuration: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditEntryModal(false);
                    setEditingEntry(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEntry}
                  disabled={isEditingEntry || !editEntryData.itemName || !editEntryData.choreographer || !editEntryData.mastery || !editEntryData.itemStyle || !editEntryData.estimatedDuration}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isEditingEntry ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Entry'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
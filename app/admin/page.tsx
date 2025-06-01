'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { REGIONS, PERFORMANCE_TYPES, AGE_CATEGORIES } from '@/lib/types';
import Link from 'next/link';

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
  createdBy: string;
  createdAt: string;
}

interface Judge {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  specialization?: string[];
  createdAt: string;
}

interface JudgeAssignment {
  id: string;
  judgeId: string;
  eventId: string;
  judgeName: string;
  judgeEmail: string;
  eventName: string;
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'judges' | 'assignments'>('events');
  const [isLoading, setIsLoading] = useState(true);
  
  // Event creation state
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    region: '',
    ageCategory: '',
    performanceType: '',
    eventDate: '',
    registrationDeadline: '',
    venue: '',
    maxParticipants: '',
    entryFee: ''
  });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [createEventMessage, setCreateEventMessage] = useState('');

  // Judge creation state
  const [newJudge, setNewJudge] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [isCreatingJudge, setIsCreatingJudge] = useState(false);
  const [createJudgeMessage, setCreateJudgeMessage] = useState('');

  // Assignment state
  const [assignment, setAssignment] = useState({
    judgeId: '',
    eventId: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState('');

  // Database cleaning state
  const [isCleaningDatabase, setIsCleaningDatabase] = useState(false);
  const [cleanDatabaseMessage, setCleanDatabaseMessage] = useState('');

  // Modal states
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateJudgeModal, setShowCreateJudgeModal] = useState(false);
  const [showAssignJudgeModal, setShowAssignJudgeModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('judgeSession');
    if (!session) {
      router.push('/portal/judge');
      return;
    }
    
    const judgeData = JSON.parse(session);
    if (!judgeData.isAdmin) {
        router.push('/judge/dashboard');
      return;
      }
    
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, judgesRes, assignmentsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/judges'),
        fetch('/api/judge-assignments')
      ]);

      const eventsData = await eventsRes.json();
      const judgesData = await judgesRes.json();
      const assignmentsData = await assignmentsRes.json();

      if (eventsData.success) setEvents(eventsData.events);
      if (judgesData.success) setJudges(judgesData.judges);
      if (assignmentsData.success) setAssignments(assignmentsData.assignments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isCreatingEvent) {
      return;
    }

    setIsCreatingEvent(true);
    setCreateEventMessage('');

    try {
      const session = localStorage.getItem('judgeSession');
      if (!session) {
        setCreateEventMessage('Error: Session expired. Please log in again.');
        return;
      }

      const judgeData = JSON.parse(session);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEvent,
          maxParticipants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants) : null,
          entryFee: parseFloat(newEvent.entryFee),
          createdBy: judgeData.id,
          status: 'upcoming'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreateEventMessage('Event created successfully!');
        setNewEvent({
          name: '',
          description: '',
          region: '',
          ageCategory: '',
          performanceType: '',
          eventDate: '',
          registrationDeadline: '',
          venue: '',
          maxParticipants: '',
          entryFee: ''
        });
        fetchData();
        setShowCreateEventModal(false);
        setTimeout(() => setCreateEventMessage(''), 5000);
      } else {
        setCreateEventMessage(`Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setCreateEventMessage('Error creating event. Please check your connection and try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isCreatingJudge) {
      return;
    }

    setIsCreatingJudge(true);
    setCreateJudgeMessage('');

    try {
      const response = await fetch('/api/judges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJudge),
      });

      const data = await response.json();

      if (data.success) {
        setCreateJudgeMessage('Judge created successfully!');
        setNewJudge({
          name: '',
          email: '',
          password: '',
          isAdmin: false
        });
        fetchData();
        setShowCreateJudgeModal(false);
        setTimeout(() => setCreateJudgeMessage(''), 5000);
      } else {
        setCreateJudgeMessage(`Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error creating judge:', error);
      setCreateJudgeMessage('Error creating judge. Please check your connection and try again.');
    } finally {
      setIsCreatingJudge(false);
    }
  };

  const handleAssignJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isAssigning) {
      return;
    }

    setIsAssigning(true);
    setAssignmentMessage('');

    try {
      const session = localStorage.getItem('judgeSession');
      if (!session) {
        setAssignmentMessage('Error: Session expired. Please log in again.');
        return;
      }

      const judgeData = JSON.parse(session);

      const response = await fetch('/api/judge-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assignment,
          assignedBy: judgeData.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAssignmentMessage('Judge assigned successfully!');
        setAssignment({
          judgeId: '',
          eventId: ''
        });
        fetchData();
        setShowAssignJudgeModal(false);
        setTimeout(() => setAssignmentMessage(''), 5000);
      } else {
        setAssignmentMessage(`Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error assigning judge:', error);
      setAssignmentMessage('Error assigning judge. Please check your connection and try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCleanDatabase = async () => {
    // Prevent double submission
    if (isCleaningDatabase) {
      return;
    }

    // Confirm the action
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL data except admin users!\n\n' +
      'This includes:\n' +
      '• All events\n' +
      '• All contestants and participants\n' +
      '• All registrations and performances\n' +
      '• All scores and rankings\n' +
      '• All judge assignments\n' +
      '• All non-admin judges\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) {
      return;
    }

    setIsCleaningDatabase(true);
    setCleanDatabaseMessage('');

    try {
      const session = localStorage.getItem('judgeSession');
      if (!session) {
        setCleanDatabaseMessage('Error: Session expired. Please log in again.');
        return;
      }

      const judgeData = JSON.parse(session);

      const response = await fetch('/api/admin/clean-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: judgeData.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCleanDatabaseMessage('✅ Database cleaned successfully! All data removed except admin users.');
        // Refresh the dashboard data
        fetchData();
        setTimeout(() => setCleanDatabaseMessage(''), 7000);
      } else {
        setCleanDatabaseMessage(`❌ Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error cleaning database:', error);
      setCleanDatabaseMessage('❌ Error cleaning database. Please check your connection and try again.');
    } finally {
      setIsCleaningDatabase(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('judgeSession');
    router.push('/portal/admin');
  };

  const clearMessages = () => {
    setCreateEventMessage('');
    setCreateJudgeMessage('');
    setAssignmentMessage('');
    setCleanDatabaseMessage('');
    setShowCreateEventModal(false);
    setShowCreateJudgeModal(false);
    setShowAssignJudgeModal(false);
  };

  useEffect(() => {
    clearMessages();
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Modern Spinner */}
            <div className="w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
            </div>
            {/* Floating Dots */}
            <div className="absolute -top-6 -left-6 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="absolute -top-6 -right-6 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="absolute -bottom-6 -left-6 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            <div className="absolute -bottom-6 -right-6 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
          </div>
          
          {/* Loading Text */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Loading EODSA Admin
            </h2>
            <p className="text-gray-600 font-medium animate-pulse">Preparing your dashboard...</p>
            
            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Enhanced Header - Mobile Optimized */}
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-8 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg sm:text-xl font-bold">E</span>
            </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  EODSA Admin
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base font-medium">Competition Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:flex items-center space-x-3 px-3 sm:px-4 py-2 bg-indigo-50 rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">System Online</span>
              </div>
              <button
                onClick={handleCleanDatabase}
                disabled={isCleaningDatabase}
                className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                {isCleaningDatabase ? (
                  <>
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                    </div>
                    <span className="font-medium">Cleaning...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm sm:text-base">🗑️</span>
                    <span className="font-medium">Clean DB</span>
                  </>
                )}
              </button>
              <Link 
                href="/admin/rankings"
                className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                <span className="text-sm sm:text-base">📊</span>
                <span className="font-medium">Rankings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                <span className="text-sm sm:text-base">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Global Database Clean Message */}
        {cleanDatabaseMessage && (
          <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl font-medium animate-slideIn border-2 ${
            cleanDatabaseMessage.includes('Error') || cleanDatabaseMessage.includes('❌')
              ? 'bg-red-50 text-red-700 border-red-200' 
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-lg sm:text-xl">
                {cleanDatabaseMessage.includes('Error') || cleanDatabaseMessage.includes('❌') ? '⚠️' : '✅'}
              </span>
              <span className="text-sm sm:text-base font-semibold">{cleanDatabaseMessage}</span>
            </div>
          </div>
        )}

        {/* Enhanced Tab Navigation - Mobile Optimized */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8 shadow-xl border border-white/50">
          <nav className="flex flex-col sm:flex-row gap-2">
            {[
              { id: 'events', label: 'Events', icon: '🏆', color: 'indigo' },
              { id: 'judges', label: 'Judges', icon: '👨‍⚖️', color: 'purple' },
              { id: 'assignments', label: 'Assignments', icon: '🔗', color: 'pink' }
            ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base transform ${
                    activeTab === tab.id
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color === 'indigo' ? 'blue' : tab.color === 'purple' ? 'pink' : 'rose'}-600 text-white shadow-lg scale-105`
                    : 'text-gray-600 hover:bg-white/80 hover:shadow-md hover:scale-102'
                }`}
              >
                <span className="text-lg sm:text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
                </button>
              ))}
            </nav>
        </div>

        {/* Events Tab - Enhanced */}
        {activeTab === 'events' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Enhanced Events List - Mobile Optimized */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-indigo-100">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs sm:text-sm">🏆</span>
                  </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Events</h2>
                    <div className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs sm:text-sm font-medium">
                      {events.length} events
                  </div>
                  </div>
                  <button
                    onClick={() => setShowCreateEventModal(true)}
                    className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base font-medium"
                  >
                    <span>➕</span>
                    <span className="hidden sm:inline">Create Event</span>
                    <span className="sm:hidden">Create</span>
                  </button>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg sm:text-2xl">🏆</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2">No events yet</h3>
                  <p className="text-sm mb-4">Create your first event to get started!</p>
                  <button
                    onClick={() => setShowCreateEventModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <span>➕</span>
                    <span>Create First Event</span>
                  </button>
                  </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Event</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Region</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">Type</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200">
                      {events.map((event) => (
                        <tr key={event.id} className="hover:bg-indigo-50/50 transition-colors duration-200">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{event.name}</div>
                              <div className="text-xs sm:text-sm text-gray-600 font-medium mt-1">{event.venue}</div>
                              <div className="text-xs text-gray-500 sm:hidden mt-1">
                                {event.region} • {event.performanceType} • {event.ageCategory}
                </div>
              </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 hidden sm:table-cell">{event.region}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{event.performanceType}</div>
                            <div className="text-xs sm:text-sm text-gray-600">{event.ageCategory}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                            <div className="hidden sm:block">
                              {new Date(event.eventDate).toLocaleDateString()}
                            </div>
                            <div className="sm:hidden">
                              {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-bold rounded-full border ${
                              event.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              event.status === 'registration_open' ? 'bg-green-50 text-green-700 border-green-200' :
                              event.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              <span className="hidden sm:inline">{event.status.replace('_', ' ').toUpperCase()}</span>
                              <span className="sm:hidden">
                                {event.status === 'upcoming' ? 'UPCOMING' : 
                                 event.status === 'registration_open' ? 'OPEN' :
                                 event.status === 'in_progress' ? 'ACTIVE' : 'CLOSED'}
                              </span>
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center">
                              <Link
                                href={`/admin/events/${event.id}`}
                                className="text-indigo-500 hover:text-indigo-700 text-xs sm:text-sm font-medium"
                              >
                                <span className="hidden sm:inline">View Participants</span>
                                <span className="sm:hidden">View</span>
                              </Link>
                  </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
              )}
                </div>
              </div>
        )}

        {/* Judges Tab - Enhanced */}
        {activeTab === 'judges' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Enhanced Judges List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-purple-100">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">👨‍⚖️</span>
                  </div>
                    <h2 className="text-xl font-bold text-gray-900">Judges</h2>
                    <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {judges.filter(j => !j.isAdmin).length} judges
                  </div>
                </div>
                  <button
                    onClick={() => setShowCreateJudgeModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                  >
                    <span>➕</span>
                    <span className="hidden sm:inline">Create Judge</span>
                    <span className="sm:hidden">Create</span>
                  </button>
              </div>
            </div>
              
              {judges.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍⚖️</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No judges yet</h3>
                  <p className="text-sm mb-4">Create your first judge to get started!</p>
                  <button
                    onClick={() => setShowCreateJudgeModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <span>➕</span>
                    <span>Create First Judge</span>
                  </button>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">Created</th>
                    </tr>
                  </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200">
                      {judges.map((judge) => (
                        <tr key={judge.id} className="hover:bg-purple-50/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{judge.name}</div>
                              <div className="text-sm text-gray-600 font-medium sm:hidden">{judge.email}</div>
                          </div>
                        </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 hidden sm:table-cell">{judge.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                              judge.isAdmin ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-300' : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {judge.isAdmin ? '👑 Admin' : '👨‍⚖️ Judge'}
                          </span>
                        </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600 hidden md:table-cell">
                            {new Date(judge.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              </div>
            </div>
          )}

        {/* Assignments Tab - Enhanced */}
        {activeTab === 'assignments' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Enhanced Assignments List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-pink-100">
              <div className="px-6 py-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🔗</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Judge Assignments</h2>
                    <div className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                      {assignments.length} assignments
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignJudgeModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                  >
                    <span>➕</span>
                    <span className="hidden sm:inline">Assign Judge</span>
                    <span className="sm:hidden">Assign</span>
                  </button>
                </div>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                  <p className="text-sm mb-4">Assign judges to events to get started!</p>
                  <button
                    onClick={() => setShowAssignJudgeModal(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    <span>➕</span>
                    <span>Create First Assignment</span>
                  </button>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Judge</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    </tr>
                  </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-pink-50/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{assignment.judgeName}</div>
                              <div className="text-sm text-gray-600 font-medium sm:hidden">{assignment.judgeEmail}</div>
                            </div>
                        </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{assignment.eventName}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600 hidden sm:table-cell">{assignment.judgeEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              </div>
            </div>
          )}
      </div>

      {/* Modal Components */}
      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">🎭</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
                </div>
                <button
                  onClick={() => setShowCreateEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Event Name</label>
                    <input
                      type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                    required
                    placeholder="e.g., EODSA Regional Championships 2024"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Venue</label>
                  <input
                    type="text"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                    required
                    placeholder="e.g., Johannesburg Civic Theatre"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                    rows={3}
                    required
                    placeholder="Describe the event..."
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Region</label>
                  <select
                    value={newEvent.region}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium"
                    required
                  >
                    <option value="">Select Region</option>
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Performance Type</label>
                  <select
                    value={newEvent.performanceType}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, performanceType: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium"
                    required
                  >
                    <option value="">Select Type</option>
                    {PERFORMANCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Age Category</label>
                  <select
                    value={newEvent.ageCategory}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, ageCategory: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium"
                    required
                  >
                    <option value="">Select Age Category</option>
                    {AGE_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="All">All Categories</option>
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Entry Fee (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEvent.entryFee}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, entryFee: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                    required
                    placeholder="300.00"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Event Date</label>
                  <input
                    type="datetime-local"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium"
                    required
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={newEvent.registrationDeadline}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium"
                    required
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Max Participants (Optional)</label>
                  <input
                    type="number"
                    value={newEvent.maxParticipants}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                    placeholder="50"
                  />
                </div>
              </div>

              {createEventMessage && (
                <div className={`mt-6 p-4 rounded-xl font-medium animate-slideIn ${
                  createEventMessage.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span>{createEventMessage.includes('Error') ? '❌' : '✅'}</span>
                    <span>{createEventMessage}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEvent}
                  className="inline-flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  {isCreatingEvent ? (
                    <>
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                      </div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Create Event</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Judge Modal */}
      {showCreateJudgeModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">👨‍⚖️</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Judge</h2>
                </div>
                <button
                  onClick={() => setShowCreateJudgeModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateJudge} className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Judge Name</label>
                  <input
                    type="text"
                      value={newJudge.name}
                      onChange={(e) => setNewJudge(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                      required
                    placeholder="Full Name"
                    />
                  </div>
                  
                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Email</label>
                    <input
                      type="email"
                      value={newJudge.email}
                      onChange={(e) => setNewJudge(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                      required
                    placeholder="judge@email.com"
                    />
                  </div>
                  
                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                    <input
                      type="password"
                      value={newJudge.password}
                      onChange={(e) => setNewJudge(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base font-medium placeholder-gray-400"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  
                <div className="lg:col-span-1 flex items-center justify-center lg:justify-start">
                  <div className="flex items-center">
                      <input
                        type="checkbox"
                      id="isAdmin"
                        checked={newJudge.isAdmin}
                        onChange={(e) => setNewJudge(prev => ({ ...prev, isAdmin: e.target.checked }))}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    <label htmlFor="isAdmin" className="ml-3 block text-sm font-medium text-gray-900">
                          Admin privileges
                        </label>
                      </div>
                    </div>
                  </div>
                  
              {createJudgeMessage && (
                <div className={`mt-6 p-4 rounded-xl font-medium animate-slideIn ${
                  createJudgeMessage.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span>{createJudgeMessage.includes('Error') ? '❌' : '✅'}</span>
                    <span>{createJudgeMessage}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateJudgeModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                    <button
                      type="submit"
                      disabled={isCreatingJudge}
                  className="inline-flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  {isCreatingJudge ? (
                    <>
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                      </div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Create Judge</span>
                    </>
                  )}
                    </button>
                  </div>
                </form>
          </div>
                  </div>
                )}

      {/* Assign Judge Modal */}
      {showAssignJudgeModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">🔗</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Judge to Event</h2>
                </div>
                <button
                  onClick={() => setShowAssignJudgeModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              </div>

            <form onSubmit={handleAssignJudge} className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Judge</label>
                  <select
                    value={assignment.judgeId}
                    onChange={(e) => setAssignment(prev => ({ ...prev, judgeId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 text-base font-medium"
                    required
                  >
                    <option value="">Choose a judge</option>
                    {judges.filter(judge => !judge.isAdmin).map(judge => (
                      <option key={judge.id} value={judge.id}>{judge.name} ({judge.email})</option>
                    ))}
                  </select>
                </div>
                
                <div className="lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Event</label>
                  <select
                    value={assignment.eventId}
                    onChange={(e) => setAssignment(prev => ({ ...prev, eventId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 text-base font-medium"
                    required
                  >
                    <option value="">Choose an event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {assignmentMessage && (
                <div className={`mt-6 p-4 rounded-xl font-medium animate-slideIn ${
                  assignmentMessage.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span>{assignmentMessage.includes('Error') ? '❌' : '✅'}</span>
                    <span>{assignmentMessage}</span>
                </div>
              </div>
          )}

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAssignJudgeModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="inline-flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  {isAssigning ? (
                    <>
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
            </div>
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Assign Judge</span>
                    </>
                  )}
                </button>
        </div>
            </form>
      </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
} 
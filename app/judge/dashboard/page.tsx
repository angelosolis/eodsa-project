'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Assignment {
  id: string;
  judgeId: string;
  eventId: string;
  assignedBy: string;
  assignedAt: string;
  status: string;
  event: {
  id: string;
  name: string;
    description: string;
    eventDate: string;
    venue: string;
  };
}

interface Performance {
  id: string;
  eventId: string;
  title: string;
  contestantName: string;
  participantNames: string[];
  duration: number;
  status: string;
  scheduledTime?: string;
}

export default function JudgeDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [filteredPerformances, setFilteredPerformances] = useState<Performance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [judgeName, setJudgeName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('judgeSession');
    if (!session) {
      router.push('/portal/judge');
      return;
    }
    
    const judgeData = JSON.parse(session);
    if (judgeData.isAdmin) {
      router.push('/admin');
      return;
    }
    
    setJudgeName(judgeData.name);
    loadJudgeData(judgeData.id);
  }, [router]);

  useEffect(() => {
    if (selectedEventId) {
      setFilteredPerformances(performances.filter(p => p.eventId === selectedEventId));
    } else {
      setFilteredPerformances([]);
    }
  }, [selectedEventId, performances]);

  const loadJudgeData = async (judgeId: string) => {
    setIsLoading(true);
    try {
      // Load judge assignments
      const assignmentsResponse = await fetch(`/api/judges/${judgeId}/assignments`);
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
        
        // Load performances for all assigned events
        const allPerformances: Performance[] = [];
        for (const assignment of assignmentsData.assignments || []) {
          const performancesResponse = await fetch(`/api/events/${assignment.eventId}/performances`);
          if (performancesResponse.ok) {
            const performancesData = await performancesResponse.json();
            allPerformances.push(...(performancesData.performances || []));
          }
        }
        setPerformances(allPerformances);
      }
    } catch (error) {
      console.error('Error loading judge data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('judgeSession');
    router.push('/portal/judge');
  };

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
              Loading Judge Dashboard
            </h2>
            <p className="text-gray-600 font-medium animate-pulse">Preparing your events...</p>
            
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
        {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👨‍⚖️</span>
              </div>
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Judge Dashboard
                </h1>
                <p className="text-gray-600 mt-1 font-medium">Welcome, {judgeName}</p>
              </div>
            </div>
              <button
                onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
              <span>🚪</span>
              <span className="font-medium">Logout</span>
              </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performances to Judge - Reorganized with Event Selection */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🎭</span>
                          </div>
              <h2 className="text-xl font-bold text-gray-900">Performances to Judge</h2>
            </div>
          </div>

          <div className="p-6">
            {/* Event Selection Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Event to Judge</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base font-medium"
              >
                <option value="">Choose an event to judge...</option>
                {assignments.map((assignment) => (
                  <option key={assignment.eventId} value={assignment.eventId}>
                    {assignment.event.name} - {new Date(assignment.event.eventDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
              
              {assignments.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No events assigned yet. Please contact an administrator.
                </p>
              )}
            </div>
            
            {/* Performances List */}
            {selectedEventId ? (
              filteredPerformances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Performance</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Participants</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-gray-200">
                      {filteredPerformances.map((performance) => (
                        <tr key={performance.id} className="hover:bg-purple-50/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{performance.title}</div>
                              <div className="text-sm text-gray-600">{performance.contestantName}</div>
              </div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <div className="text-sm text-gray-600">
                              {performance.participantNames.join(', ')}
                  </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{performance.duration} min</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${
                              performance.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              performance.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              performance.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {performance.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/judge/score/${performance.id}`}
                              className="text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors"
                            >
                              Score Performance
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No performances for this event</h3>
                  <p className="text-sm">Performances will appear here once entries are approved and converted to performances.</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Select an event to begin judging</h3>
                <p className="text-sm">Choose an event from the dropdown above to see performances ready for scoring.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
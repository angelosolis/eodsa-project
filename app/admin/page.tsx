'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface JudgeSession {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface Contestant {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'studio' | 'private';
  studioName?: string;
  registrationDate: string;
}

interface Performance {
  id: string;
  contestantId: string;
  title: string;
  category: string;
  duration: number;
}

interface Judge {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface Score {
  id: string;
  judgeId: string;
  performanceId: string;
  technicalScore: number;
  artisticScore: number;
  overallScore: number;
  comments: string;
  submittedAt: string;
  judgeName?: string;
}

interface RankedPerformance {
  performanceId: string;
  contestantName: string;
  performanceTitle: string;
  category: string;
  averageScore: number;
  totalScores: number;
  rank: number;
}

export default function AdminDashboard() {
  const [judgeSession, setJudgeSession] = useState<JudgeSession | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'contestants' | 'judges'>('overview');
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [newJudge, setNewJudge] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });
  const [isCreatingJudge, setIsCreatingJudge] = useState(false);
  const [createJudgeMessage, setCreateJudgeMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('judgeSession');
    if (session) {
      const parsedSession = JSON.parse(session);
      if (parsedSession.isAdmin) {
        setJudgeSession(parsedSession);
        fetchAllData();
      } else {
        router.push('/judge/dashboard');
      }
    } else {
      router.push('/judge/login');
    }
  }, [router]);

  const fetchAllData = async () => {
    try {
      const [contestantsRes, performancesRes, judgesRes] = await Promise.all([
        fetch('/api/contestants'),
        fetch('/api/performances'),
        fetch('/api/judges')
      ]);

      const [contestantsData, performancesData, judgesData] = await Promise.all([
        contestantsRes.json(),
        performancesRes.json(),
        judgesRes.json()
      ]);

      if (contestantsData.success) setContestants(contestantsData.contestants);
      if (performancesData.success) setPerformances(performancesData.performances);
      if (judgesData.success) setJudges(judgesData.judges);

      // Fetch all scores for all performances
      if (performancesData.success) {
        const scoresPromises = performancesData.performances.map((performance: Performance) =>
          fetch(`/api/scores/performance/${performance.id}`).then(res => res.json())
        );
        
        const scoresResults = await Promise.all(scoresPromises);
        const allScoresFlat = scoresResults
          .filter(result => result.success)
          .flatMap(result => result.scores);
        
        setAllScores(allScoresFlat);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('judgeSession');
    router.push('/');
  };

  const getContestantById = (id: string) => {
    return contestants.find(c => c.id === id);
  };

  const getScoresForPerformance = (performanceId: string) => {
    return allScores.filter(score => score.performanceId === performanceId);
  };

  const calculateAverageScore = (performanceId: string) => {
    const scores = getScoresForPerformance(performanceId);
    if (scores.length === 0) return 0;
    
    const totalScore = scores.reduce((sum, score) => {
      return sum + (score.technicalScore + score.artisticScore + score.overallScore) / 3;
    }, 0);
    
    return totalScore / scores.length;
  };

  // Calculate rankings
  const getRankedPerformances = (): RankedPerformance[] => {
    const rankedPerformances = performances.map(performance => {
      const contestant = getContestantById(performance.contestantId);
      const performanceScores = getScoresForPerformance(performance.id);
      const averageScore = calculateAverageScore(performance.id);
      
      return {
        performanceId: performance.id,
        contestantName: contestant?.name || 'Unknown',
        performanceTitle: performance.title,
        category: performance.category,
        averageScore,
        totalScores: performanceScores.length,
        rank: 0 // Will be calculated after sorting
      };
    });

    // Sort by average score (descending) and assign ranks
    rankedPerformances.sort((a, b) => b.averageScore - a.averageScore);
    rankedPerformances.forEach((performance, index) => {
      performance.rank = index + 1;
    });

    return rankedPerformances;
  };

  const rankedPerformances = getRankedPerformances();

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingJudge(true);
    setCreateJudgeMessage('');

    try {
      const response = await fetch('/api/judges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newJudge)
      });

      const data = await response.json();

      if (data.success) {
        setCreateJudgeMessage('Judge account created successfully!');
        setNewJudge({
          name: '',
          email: '',
          password: '',
          isAdmin: false
        });
        // Refresh the judges list
        fetchAllData();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setCreateJudgeMessage('');
        }, 3000);
      } else {
        setCreateJudgeMessage(data.error || 'Failed to create judge account.');
      }
    } catch (error) {
      console.error('Error creating judge:', error);
      setCreateJudgeMessage('An error occurred while creating the judge account.');
    } finally {
      setIsCreatingJudge(false);
    }
  };

  if (!judgeSession || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Competition Management System</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/judge/dashboard"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Judge View
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'rankings', label: 'Rankings', icon: '🏆' },
                { id: 'contestants', label: 'Contestants', icon: '👥' },
                { id: 'judges', label: 'Judges', icon: '⚖️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Contestants</p>
                    <p className="text-2xl font-bold text-gray-900">{contestants.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Performances</p>
                    <p className="text-2xl font-bold text-gray-900">{performances.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Judges</p>
                    <p className="text-2xl font-bold text-gray-900">{judges.length}</p>
                    <p className="text-xs text-gray-500">
                      {judges.filter(j => j.isAdmin).length} admin, {judges.filter(j => !j.isAdmin).length} regular
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Scores</p>
                    <p className="text-2xl font-bold text-gray-900">{allScores.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Rankings</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contestant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Scores
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankedPerformances.map((performance) => (
                      <tr key={performance.performanceId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                              performance.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                              performance.rank === 2 ? 'bg-gray-100 text-gray-800' :
                              performance.rank === 3 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {performance.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {performance.contestantName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{performance.performanceTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {performance.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {performance.averageScore.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{performance.totalScores}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contestants Tab */}
          {activeTab === 'contestants' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contestants</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Studio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contestants.map((contestant) => (
                      <tr key={contestant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{contestant.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contestant.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contestant.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            contestant.type === 'studio' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {contestant.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contestant.studioName || '-'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Judges Tab */}
          {activeTab === 'judges' && (
            <div className="space-y-6">
              {/* Add New Judge Form */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Judge</h2>
                <form onSubmit={handleCreateJudge} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="judgeName" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="judgeName"
                      value={newJudge.name}
                      onChange={(e) => setNewJudge(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter judge's full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="judgeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="judgeEmail"
                      value={newJudge.email}
                      onChange={(e) => setNewJudge(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="judge@example.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="judgePassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="judgePassword"
                      value={newJudge.password}
                      onChange={(e) => setNewJudge(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                    {newJudge.password && newJudge.password.length < 6 && (
                      <p className="text-xs text-red-600 mt-1">Password must be at least 6 characters long</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="judgeIsAdmin"
                        checked={newJudge.isAdmin}
                        onChange={(e) => setNewJudge(prev => ({ ...prev, isAdmin: e.target.checked }))}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3">
                        <label htmlFor="judgeIsAdmin" className="block text-sm font-medium text-gray-900">
                          Admin privileges
                        </label>
                        <p className="text-xs text-gray-500">
                          Admin judges can access the admin dashboard and manage other judges
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isCreatingJudge}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCreatingJudge ? 'Creating...' : 'Create Judge Account'}
                    </button>
                  </div>
                </form>
                
                {createJudgeMessage && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    createJudgeMessage.includes('successfully') 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {createJudgeMessage}
                  </div>
                )}
              </div>

              {/* Existing Judges Table */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Existing Judges</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scores Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {judges.map((judge) => {
                        const judgeScores = allScores.filter(score => score.judgeId === judge.id);
                        return (
                          <tr key={judge.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{judge.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{judge.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                judge.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {judge.isAdmin ? 'Admin' : 'Judge'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{judgeScores.length}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
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

interface Performance {
  id: string;
  contestantId: string;
  title: string;
  category: string;
  duration: number;
  contestantName?: string;
}

interface Contestant {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'studio' | 'private';
  studioName?: string;
}

interface ExistingScore {
  id: string;
  judgeId: string;
  performanceId: string;
  technicalScore: number;
  artisticScore: number;
  overallScore: number;
  comments: string;
  submittedAt: string;
}

export default function JudgeDashboard() {
  const [judgeSession, setJudgeSession] = useState<JudgeSession | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerformance, setSelectedPerformance] = useState<string>('');
  const [existingScore, setExistingScore] = useState<ExistingScore | null>(null);
  const [scoredPerformances, setScoredPerformances] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState({
    technicalScore: 5,
    artisticScore: 5,
    overallScore: 5,
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem('judgeSession');
    if (session) {
      setJudgeSession(JSON.parse(session));
      fetchData();
    } else {
      router.push('/judge/login');
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const [performancesRes, contestantsRes] = await Promise.all([
        fetch('/api/performances'),
        fetch('/api/contestants')
      ]);

      const performancesData = await performancesRes.json();
      const contestantsData = await contestantsRes.json();

      if (performancesData.success) {
        setPerformances(performancesData.performances);
      }
      if (contestantsData.success) {
        setContestants(contestantsData.contestants);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllScoredPerformances = async (judgeId: string, performanceList: Performance[]) => {
    const scored = new Set<string>();
    
    // Check each performance to see if it's been scored
    await Promise.all(
      performanceList.map(async (performance) => {
        try {
          const response = await fetch(`/api/scores/${performance.id}/${judgeId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.score) {
              scored.add(performance.id);
            }
          }
        } catch (error) {
          console.error('Error checking score for performance:', performance.id, error);
        }
      })
    );
    
    setScoredPerformances(scored);
  };

  useEffect(() => {
    if (judgeSession && performances.length > 0) {
      checkAllScoredPerformances(judgeSession.id, performances);
    }
  }, [judgeSession, performances]);

  const fetchExistingScore = async (performanceId: string, judgeId: string) => {
    try {
      const response = await fetch(`/api/scores/${performanceId}/${judgeId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.score) {
          setExistingScore(result.score);
          setScores({
            technicalScore: result.score.technicalScore,
            artisticScore: result.score.artisticScore,
            overallScore: result.score.overallScore,
            comments: result.score.comments
          });
        } else {
          setExistingScore(null);
          setScores({
            technicalScore: 5,
            artisticScore: 5,
            overallScore: 5,
            comments: ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing score:', error);
      setExistingScore(null);
    }
  };

  const handlePerformanceSelect = (performanceId: string) => {
    setSelectedPerformance(performanceId);
    if (judgeSession) {
      fetchExistingScore(performanceId, judgeSession.id);
    }
  };

  const getContestantById = (id: string) => {
    return contestants.find(c => c.id === id);
  };

  const handleLogout = () => {
    localStorage.removeItem('judgeSession');
    router.push('/');
  };

  const handleScoreChange = (field: string, value: number | string) => {
    setScores(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerformance || !judgeSession) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judgeId: judgeSession.id,
          performanceId: selectedPerformance,
          ...scores
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setSubmitMessage(result.message || 'Score submitted successfully!');
        
        // Update existing score state
        if (result.score) {
          setExistingScore(result.score);
        }
        
        // Add to scored performances set
        setScoredPerformances(prev => new Set([...prev, selectedPerformance]));
        
        setTimeout(() => {
          setSubmitted(false);
          setSubmitMessage('');
        }, 3000);
      } else {
        console.error('Error submitting score:', result.error);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!judgeSession || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Judge Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {judgeSession.name}</p>
            </div>
            <div className="flex space-x-4">
              {judgeSession.isAdmin && (
                <Link 
                  href="/admin"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700">{submitMessage}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Performance Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Performance</h2>
            <div className="space-y-3">
              {performances.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No performances available</p>
              ) : (
                performances.map(performance => {
                  const contestant = getContestantById(performance.contestantId);
                  const isSelected = selectedPerformance === performance.id;
                  const isScored = scoredPerformances.has(performance.id);
                  
                  return (
                    <div
                      key={performance.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors relative ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePerformanceSelect(performance.id)}
                    >
                      {/* Scored indicator */}
                      {isScored && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start pr-8">
                        <div>
                          <h3 className="font-medium text-gray-900">{performance.title}</h3>
                          <p className="text-sm text-gray-600">by {contestant?.name || performance.contestantName}</p>
                          <p className="text-sm text-gray-500">{performance.category} • {performance.duration} min</p>
                          {isSelected && existingScore && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Previously scored on {new Date(existingScore.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                          {isScored && !isSelected && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Scored
                            </p>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scoring Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Score Performance</h2>
              {existingScore && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Updating Score
                </span>
              )}
            </div>
            
            {!selectedPerformance ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">Select a performance to start scoring</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitScore} className="space-y-6">
                {/* Technical Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technical Score (1-10)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.technicalScore}
                      onChange={(e) => handleScoreChange('technicalScore', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-medium">{scores.technicalScore}</span>
                  </div>
                </div>

                {/* Artistic Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artistic Score (1-10)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.artisticScore}
                      onChange={(e) => handleScoreChange('artisticScore', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-medium">{scores.artisticScore}</span>
                  </div>
                </div>

                {/* Overall Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Score (1-10)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores.overallScore}
                      onChange={(e) => handleScoreChange('overallScore', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-medium">{scores.overallScore}</span>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={scores.comments}
                    onChange={(e) => handleScoreChange('comments', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add your comments about the performance..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : existingScore ? 'Update Score' : 'Submit Score'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
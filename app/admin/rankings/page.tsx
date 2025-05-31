'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { REGIONS, AGE_CATEGORIES, PERFORMANCE_TYPES } from '@/lib/types';

interface RankingData {
  performanceId: string;
  region: string;
  ageCategory: string;
  performanceType: string;
  title: string;
  contestantName: string;
  totalScore: number;
  averageScore: number;
  rank: number;
  judgeCount: number;
}

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [filteredRankings, setFilteredRankings] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('');
  const [selectedPerformanceType, setSelectedPerformanceType] = useState('');

  useEffect(() => {
    loadRankings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rankings, selectedRegion, selectedAgeCategory, selectedPerformanceType]);

  const loadRankings = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/rankings');
      if (response.ok) {
        const data = await response.json();
        setRankings(data);
      } else {
        setError('Failed to load rankings');
      }
    } catch (error) {
      setError('Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = rankings;
    
    if (selectedRegion) {
      filtered = filtered.filter(r => r.region === selectedRegion);
    }
    
    if (selectedAgeCategory) {
      filtered = filtered.filter(r => r.ageCategory === selectedAgeCategory);
    }
    
    if (selectedPerformanceType) {
      filtered = filtered.filter(r => r.performanceType === selectedPerformanceType);
    }
    
    setFilteredRankings(filtered);
  };

  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedAgeCategory('');
    setSelectedPerformanceType('');
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  // Group rankings by category for better display
  const groupedRankings = filteredRankings.reduce((groups, ranking) => {
    const key = `${ranking.region}-${ranking.ageCategory}-${ranking.performanceType}`;
    if (!groups[key]) {
      groups[key] = {
        region: ranking.region,
        ageCategory: ranking.ageCategory,
        performanceType: ranking.performanceType,
        rankings: []
      };
    }
    groups[key].rankings.push(ranking);
    return groups;
  }, {} as Record<string, {
    region: string;
    ageCategory: string;
    performanceType: string;
    rankings: RankingData[];
  }>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Competition Rankings</h1>
              <p className="text-gray-600">Automated tabulation and rankings (Admin Only)</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={loadRankings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Rankings
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Regions</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Category</label>
              <select
                value={selectedAgeCategory}
                onChange={(e) => setSelectedAgeCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Ages</option>
                {AGE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Performance Type</label>
              <select
                value={selectedPerformanceType}
                onChange={(e) => setSelectedPerformanceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {PERFORMANCE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Rankings Display */}
        {Object.keys(groupedRankings).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Available</h3>
            <p className="text-gray-600">
              Rankings will appear here once performances have been scored by judges.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(groupedRankings).map((group, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.region} - {group.ageCategory} - {group.performanceType}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {group.rankings.length} performance{group.rankings.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
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
                          Total Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Judges
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.rankings.map((ranking) => (
                        <tr key={ranking.performanceId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRankBadgeColor(ranking.rank)}`}>
                              {getRankIcon(ranking.rank)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {ranking.contestantName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{ranking.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {ranking.totalScore.toFixed(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ranking.averageScore.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {ranking.judgeCount} judge{ranking.judgeCount !== 1 ? 's' : ''}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredRankings.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredRankings.length}</div>
                <div className="text-sm text-gray-600">Total Performances</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(filteredRankings.map(r => r.region)).size}
                </div>
                <div className="text-sm text-gray-600">Regions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(filteredRankings.map(r => r.ageCategory)).size}
                </div>
                <div className="text-sm text-gray-600">Age Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(filteredRankings.map(r => r.performanceType)).size}
                </div>
                <div className="text-sm text-gray-600">Performance Types</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
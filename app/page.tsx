'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [eodsaId, setEodsaId] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Compact Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          {/* EODSA Logo Placeholder */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
            <span className="text-white text-3xl font-bold">EODSA</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Element of Dance South Africa
          </h1>
          <p className="text-gray-300 text-lg">Competition Management Portal</p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
            <p className="text-gray-400">Choose your path to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* New User Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-indigo-500/30 p-8 text-center hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-indigo-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-2xl">👋</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">New User</h3>
              <p className="text-gray-300 mb-6">
                Register as a new contestant or studio to participate in EODSA competitions.
              </p>
              <Link 
                href="/register"
                className="block w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Registration
              </Link>
            </div>

            {/* Existing User Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-purple-500/30 p-8 text-center hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-white text-2xl">🎪</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Existing User</h3>
              <p className="text-gray-300 mb-6">
                Already have an EODSA ID? Enter the event dashboard to register for competitions.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={eodsaId}
                    onChange={(e) => setEodsaId(e.target.value)}
                    placeholder="Enter your EODSA ID"
                    className="flex-1 px-4 py-3 bg-gray-700 border-2 border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium text-white placeholder-gray-400"
                  />
                </div>
                <Link 
                  href={eodsaId ? `/event-dashboard?eodsaId=${eodsaId}` : '#'}
                  className={`block w-full px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    eodsaId 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={eodsaId ? undefined : (e) => e.preventDefault()}
                >
                  Enter Event Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

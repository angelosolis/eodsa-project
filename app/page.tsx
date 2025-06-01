'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [eodsaId, setEodsaId] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  EODSA Competition System
                </h1>
                <p className="text-sm text-gray-600 font-medium">Excellence in Dance through Competition</p>
              </div>
            </div>
            <Link 
              href="/portal/judge"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200 font-medium"
            >
              <span>🎯</span>
              <span>Judge Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-8 shadow-xl">
              <span className="text-white text-3xl">🏆</span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Welcome to <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">EODSA</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Eastern Online Dance Sports Association - The premier platform for dance competition management. 
              Register as a new competitor or enter events with your existing EODSA ID.
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* New Registration */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8 hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-white text-2xl">🆕</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">New to EODSA?</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Get started by registering your studio or private dancers. You'll receive your unique EODSA ID 
                  and can immediately start entering competitions.
                </p>
                <Link 
                  href="/register"
                  className="block w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Register New Account
                </Link>
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">What you'll get:</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• Unique EODSA ID for all competitions</li>
                    <li>• Ability to register multiple dancers</li>
                    <li>• Access to all regional events</li>
                    <li>• Performance tracking and rankings</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Existing Member */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8 hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-white text-2xl">🎪</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Already have EODSA ID?</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Enter competitions directly using your existing EODSA ID. Browse available events 
                  and submit your performance entries.
                </p>
                
                {/* Quick Entry with EODSA ID */}
                <div className="space-y-4 mb-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={eodsaId}
                      onChange={(e) => setEodsaId(e.target.value)}
                      placeholder="Enter your EODSA ID"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium"
                    />
                    <Link 
                      href={eodsaId ? `/event-entry?eodsaId=${eodsaId}` : '/event-entry'}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        eodsaId 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Go
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">Or browse events first:</p>
                  <Link 
                    href="/event-entry"
                    className="block w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Browse & Enter Events
                  </Link>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <h4 className="font-semibold text-indigo-800 mb-2">Competition Features:</h4>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Solo, Duet, Trio & Group categories</li>
                    <li>• Multiple age groups and skill levels</li>
                    <li>• Professional judging and scoring</li>
                    <li>• Live rankings and results</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose EODSA?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🌍</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Regional Coverage</h4>
                <p className="text-gray-600">Competitions across Gauteng, Free State, and Mpumalanga with standardized judging.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Real-time Results</h4>
                <p className="text-gray-600">Live scoring, instant rankings, and immediate feedback from professional judges.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">🏅</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Professional Standards</h4>
                <p className="text-gray-600">Certified judges, standardized scoring, and comprehensive performance tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-lg border-t border-indigo-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 font-medium">
              © 2024 Eastern Online Dance Sports Association. Excellence in Motion.
            </p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">System Online & Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

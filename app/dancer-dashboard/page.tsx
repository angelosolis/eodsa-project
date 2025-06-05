'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/ui/custom-alert';

interface DancerSession {
  id: string;
  name: string;
  eodsaId: string;
  approved: boolean;
  email?: string;
}

interface StudioApplication {
  id: string;
  studioId: string;
  studioName: string;
  studioEmail: string;
  contactPerson: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  respondedAt?: string;
  rejectionReason?: string;
}

interface AvailableStudio {
  id: string;
  name: string;
  contactPerson: string;
  address: string;
  email: string;
  phone: string;
}

export default function DancerDashboardPage() {
  const [dancerSession, setDancerSession] = useState<DancerSession | null>(null);
  const [applications, setApplications] = useState<StudioApplication[]>([]);
  const [availableStudios, setAvailableStudios] = useState<AvailableStudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStudioBrowser, setShowStudioBrowser] = useState(false);
  const [applyingToStudio, setApplyingToStudio] = useState<string | null>(null);
  const router = useRouter();
  const { showConfirm } = useAlert();

  useEffect(() => {
    // Check for dancer session
    const session = localStorage.getItem('dancerSession');
    if (!session) {
      router.push('/dancer-login');
      return;
    }

    try {
      const parsedSession = JSON.parse(session);
      setDancerSession(parsedSession);
      loadDancerData(parsedSession.id);
    } catch {
      router.push('/dancer-login');
    }
  }, [router]);

  const loadDancerData = async (dancerId: string) => {
    try {
      // Load applications
      const appsResponse = await fetch(`/api/dancers/applications?dancerId=${dancerId}`);
      const appsData = await appsResponse.json();
      
      if (appsData.success) {
        setApplications(appsData.applications);
      }

      // Load available studios
      const studiosResponse = await fetch(`/api/dancers/available-studios?dancerId=${dancerId}`);
      const studiosData = await studiosResponse.json();
      
      if (studiosData.success) {
        setAvailableStudios(studiosData.studios);
      }
    } catch (error) {
      console.error('Error loading dancer data:', error);
      setError('Failed to load dancer information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToStudio = async (studioId: string) => {
    if (!dancerSession) return;
    
    setApplyingToStudio(studioId);
    try {
      const response = await fetch('/api/dancers/apply-to-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dancerId: dancerSession.id,
          studioId: studioId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadDancerData(dancerSession.id);
        setShowStudioBrowser(false);
      } else {
        setError(data.error || 'Failed to apply to studio');
      }
    } catch (error) {
      setError('Failed to apply to studio');
    } finally {
      setApplyingToStudio(null);
    }
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    showConfirm(
      'Are you sure you want to withdraw this application?',
      () => {
        performWithdrawApplication(applicationId);
      }
    );
  };

  const performWithdrawApplication = async (applicationId: string) => {

    try {
      const response = await fetch(`/api/dancers/applications/${applicationId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success && dancerSession) {
        await loadDancerData(dancerSession.id);
      } else {
        setError(data.error || 'Failed to withdraw application');
      }
    } catch (error) {
      setError('Failed to withdraw application');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dancerSession');
    router.push('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dancer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dancerSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Dancer Dashboard
              </h1>
              <p className="text-gray-300">Welcome back, {dancerSession.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/event-dashboard?eodsaId=${dancerSession.eodsaId}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🎭 Compete
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Status Card */}
        <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Registration Status</h2>
              <p className="text-gray-300">EODSA ID: {dancerSession.eodsaId}</p>
              <div className="flex items-center mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dancerSession.approved 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {dancerSession.approved ? '✅ Approved' : '⏳ Pending Admin Approval'}
                </span>
              </div>
            </div>
            
            {dancerSession.approved && (
              <button
                onClick={() => setShowStudioBrowser(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🏢 Apply to Studios
              </button>
            )}
          </div>
          
          {!dancerSession.approved && (
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                📋 Your registration is pending admin approval. Once approved, you'll be able to apply to dance studios and participate in competitions.
              </p>
            </div>
          )}
        </div>

        {/* Applications Section */}
        <div className="bg-gray-800/80 rounded-2xl border border-gray-700/20 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">My Studio Applications</h3>
            <p className="text-gray-400 text-sm mt-1">Track your applications to dance studios</p>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-gray-400 mb-4">No studio applications yet</p>
              {dancerSession.approved && (
                <button
                  onClick={() => setShowStudioBrowser(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply to Your First Studio
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{application.studioName}</h4>
                        <p className="text-gray-300 text-sm">Contact: {application.contactPerson}</p>
                        <p className="text-gray-400 text-xs">Applied: {new Date(application.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusBadge(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                        {application.status === 'pending' && (
                          <button
                            onClick={() => handleWithdrawApplication(application.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                    {application.status === 'rejected' && application.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded">
                        <p className="text-red-200 text-sm">
                          <strong>Reason:</strong> {application.rejectionReason}
                        </p>
                      </div>
                    )}
                    {application.status === 'accepted' && (
                      <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded">
                        <p className="text-green-200 text-sm">
                          🎉 Congratulations! You've been accepted to this studio and can now participate in competitions under their name.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Studio Browser Modal */}
        {showStudioBrowser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Available Studios</h3>
                  <button
                    onClick={() => setShowStudioBrowser(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {availableStudios.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No available studios to apply to</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableStudios.map((studio) => (
                      <div key={studio.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-white">{studio.name}</h4>
                            <p className="text-gray-300 text-sm">Contact: {studio.contactPerson}</p>
                            <p className="text-gray-400 text-sm">{studio.address}</p>
                            <p className="text-gray-400 text-xs">📧 {studio.email} • 📞 {studio.phone}</p>
                          </div>
                          <button
                            onClick={() => handleApplyToStudio(studio.id)}
                            disabled={applyingToStudio === studio.id}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            {applyingToStudio === studio.id ? 'Applying...' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
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

// Application interface for the new unified system
interface DancerApplication {
  id: string;
  dancerId: string;
  studioId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  respondedAt?: string;
  respondedBy?: string;
  rejectionReason?: string;
  dancer: {
    id: string;
    eodsaId: string;
    name: string;
    age: number;
    dateOfBirth: string;
    nationalId: string;
    email?: string;
    phone?: string;
    approved: boolean;
  };
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

export default function StudioDashboardPage() {
  const [studioSession, setStudioSession] = useState<StudioSession | null>(null);
  const [applications, setApplications] = useState<DancerApplication[]>([]);
  const [acceptedDancers, setAcceptedDancers] = useState<AcceptedDancer[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'dancers'>('applications');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingApplication, setRejectingApplication] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
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
      
      // Load applications and accepted dancers in parallel
      const [applicationsResponse, dancersResponse] = await Promise.all([
        fetch(`/api/studios/applications?studioId=${studioId}`),
        fetch(`/api/studios/dancers-new?studioId=${studioId}`)
      ]);

      const applicationsData = await applicationsResponse.json();
      const dancersData = await dancersResponse.json();

      if (applicationsData.success) {
        setApplications(applicationsData.applications);
      } else {
        setError(applicationsData.error || 'Failed to load applications');
      }

      if (dancersData.success) {
        setAcceptedDancers(dancersData.dancers);
      } else {
        setError(dancersData.error || 'Failed to load dancers');
      }
    } catch (error) {
      console.error('Load data error:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    if (!studioSession) return;

    try {
      const response = await fetch('/api/studios/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'accept',
          respondedBy: studioSession.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload data to reflect changes
        loadData(studioSession.id);
      } else {
        setError(data.error || 'Failed to accept application');
      }
    } catch (error) {
      console.error('Accept application error:', error);
      setError('Failed to accept application');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!studioSession || !rejectionReason.trim()) return;

    try {
      const response = await fetch('/api/studios/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'reject',
          respondedBy: studioSession.id,
          rejectionReason: rejectionReason.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRejectingApplication(null);
        setRejectionReason('');
        // Reload data to reflect changes
        loadData(studioSession.id);
      } else {
        setError(data.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Reject application error:', error);
      setError('Failed to reject application');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studioSession');
    router.push('/studio-login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-900 text-yellow-200 text-xs rounded-full">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-900 text-green-200 text-xs rounded-full">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-900 text-red-200 text-xs rounded-full">Rejected</span>;
      case 'withdrawn':
        return <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">Withdrawn</span>;
      default:
        return null;
    }
  };

  const getApprovalBadge = (approved: boolean) => {
    return approved ? (
      <span className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded-full">Admin Approved</span>
    ) : (
      <span className="px-2 py-1 bg-orange-900 text-orange-200 text-xs rounded-full">Pending Admin</span>
    );
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

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
          <p className="text-gray-300">Manage dancer applications and your accepted dancers</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Pending</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Accepted Dancers</h3>
                <p className="text-3xl font-bold text-purple-400">{acceptedDancers.length}</p>
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
                <h3 className="text-lg font-semibold text-white">Total Applications</h3>
                <p className="text-3xl font-bold text-green-400">{applications.length}</p>
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
                <h3 className="text-lg font-semibold text-white">Acceptance Rate</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {applications.length > 0 
                    ? Math.round((applications.filter(a => a.status === 'accepted').length / applications.length) * 100)
                    : 0
                  }%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800/80 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'applications'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Applications ({applications.length})
            </button>
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
          </div>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-gray-800/80 rounded-2xl border border-gray-700/20 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Dancer Applications</h3>
                  <p className="text-gray-400 text-sm mt-1">Review and respond to dancer applications</p>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Applications</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">No applications found</p>
                <p className="text-gray-500 text-sm">Dancers will appear here when they apply to join your studio</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredApplications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <h4 className="text-lg font-semibold text-white mr-3">{application.dancer.name}</h4>
                          <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium mr-2">
                            Age {application.dancer.age}
                          </span>
                          {getStatusBadge(application.status)}
                          {getApprovalBadge(application.dancer.approved)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-400">EODSA ID:</span>
                            <span className="text-white ml-2 font-mono">{application.dancer.eodsaId}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">National ID:</span>
                            <span className="text-white ml-2 font-mono">{application.dancer.nationalId}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Applied:</span>
                            <span className="text-white ml-2">{new Date(application.appliedAt).toLocaleDateString()}</span>
                          </div>
                          {application.dancer.email && (
                            <div>
                              <span className="text-gray-400">Email:</span>
                              <span className="text-white ml-2">{application.dancer.email}</span>
                            </div>
                          )}
                          {application.dancer.phone && (
                            <div>
                              <span className="text-gray-400">Phone:</span>
                              <span className="text-white ml-2">{application.dancer.phone}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Date of Birth:</span>
                            <span className="text-white ml-2">{new Date(application.dancer.dateOfBirth).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {application.status === 'rejected' && application.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <p className="text-red-300 text-sm">
                              <strong>Rejection Reason:</strong> {application.rejectionReason}
                            </p>
                          </div>
                        )}

                        {!application.dancer.approved && (
                          <div className="mt-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                            <p className="text-orange-300 text-sm">
                              ⚠️ This dancer is awaiting admin approval before they can compete
                            </p>
                          </div>
                        )}
                      </div>

                      {application.status === 'pending' && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleAcceptApplication(application.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setRejectingApplication(application.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dancers Tab */}
        {activeTab === 'dancers' && (
          <div className="bg-gray-800/80 rounded-2xl border border-gray-700/20 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">My Dancers</h3>
              <p className="text-gray-400 text-sm mt-1">Dancers who are part of your studio</p>
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

        {/* Rejection Modal */}
        {rejectingApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Reject Application</h3>
              <p className="text-gray-300 mb-4">Please provide a reason for rejecting this application:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-white placeholder-gray-400 resize-none"
                placeholder="Enter rejection reason..."
                rows={4}
                required
              />
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => handleRejectApplication(rejectingApplication)}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    setRejectingApplication(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WaiverModal from '@/app/components/WaiverModal';

interface StudioSession {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
}

interface Waiver {
  id: string;
  dancerId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  relationshipToDancer: string;
  signedDate: string;
  signaturePath: string;
  idDocumentPath: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface Dancer {
  id: string;
  name: string;
  age: number;
  dateOfBirth: string;
  nationalId: string;
  waiver?: Waiver;
}

interface StudioDancer {
  contestantId: string;
  eodsaId: string;
  studioName: string;
  registrationDate: string;
  dancers: Dancer[];
}

interface AddDancerForm {
  name: string;
  dateOfBirth: string;
  nationalId: string;
}

export default function StudioDashboardPage() {
  const [studioSession, setStudioSession] = useState<StudioSession | null>(null);
  const [dancers, setDancers] = useState<StudioDancer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDancer, setEditingDancer] = useState<Dancer | null>(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [pendingMinorDancer, setPendingMinorDancer] = useState<{ id: string; name: string } | null>(null);
  const [addForm, setAddForm] = useState<AddDancerForm>({
    name: '',
    dateOfBirth: '',
    nationalId: ''
  });
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
    loadDancers(parsedSession.id);
  }, [router]);

  const loadDancers = async (studioId: string) => {
    try {
      const response = await fetch(`/api/studios/dancers?studioId=${studioId}`);
      const data = await response.json();

      if (data.success) {
        setDancers(data.dancers);
      } else {
        setError(data.error || 'Failed to load dancers');
      }
    } catch (error) {
      console.error('Load dancers error:', error);
      setError('Failed to load dancers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDancer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioSession) return;

    try {
      // Calculate age from date of birth
      const birthDate = new Date(addForm.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const response = await fetch('/api/studios/dancers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studioId: studioSession.id,
          dancer: {
            name: addForm.name,
            age: age,
            dateOfBirth: addForm.dateOfBirth,
            nationalId: addForm.nationalId
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAddForm({ name: '', dateOfBirth: '', nationalId: '' });
        setShowAddForm(false);
        
        // Check if dancer is under 18 and needs a waiver
        if (age < 18) {
          setPendingMinorDancer({ id: data.dancer.dancerId, name: addForm.name });
          setShowWaiverModal(true);
        }
        
        loadDancers(studioSession.id);
      } else {
        setError(data.error || 'Failed to add dancer');
      }
    } catch (error) {
      console.error('Add dancer error:', error);
      setError('Failed to add dancer');
    }
  };

  const handleWaiverSubmitted = () => {
    setPendingMinorDancer(null);
    setShowWaiverModal(false);
    // Reload dancers to get updated waiver status
    if (studioSession) {
      loadDancers(studioSession.id);
    }
  };

  const handleWaiverModalClose = () => {
    setPendingMinorDancer(null);
    setShowWaiverModal(false);
  };

  const checkWaiverStatus = async (dancerId: string) => {
    try {
      const response = await fetch(`/api/studios/waivers?dancerId=${dancerId}`);
      const data = await response.json();
      return data.waiver;
    } catch (error) {
      console.error('Check waiver status error:', error);
      return null;
    }
  };

  const getWaiverStatusBadge = (dancer: Dancer) => {
    if (dancer.age >= 18) {
      return (
        <span className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded-full">
          Adult
        </span>
      );
    }
    
    if (!dancer.waiver) {
      return (
        <span className="px-2 py-1 bg-red-900 text-red-200 text-xs rounded-full">
          Waiver Required
        </span>
      );
    }
    
    if (dancer.waiver.approved) {
      return (
        <span className="px-2 py-1 bg-green-900 text-green-200 text-xs rounded-full">
          Waiver Approved
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 bg-yellow-900 text-yellow-200 text-xs rounded-full">
        Waiver Pending
      </span>
    );
  };

  const handleUpdateDancer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDancer || !studioSession) return;

    try {
      // Calculate age from date of birth
      const birthDate = new Date(editingDancer.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const response = await fetch('/api/studios/dancers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dancerId: editingDancer.id,
          updates: {
            name: editingDancer.name,
            age: age,
            dateOfBirth: editingDancer.dateOfBirth,
            nationalId: editingDancer.nationalId
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingDancer(null);
        loadDancers(studioSession.id);
      } else {
        setError(data.error || 'Failed to update dancer');
      }
    } catch (error) {
      console.error('Update dancer error:', error);
      setError('Failed to update dancer');
    }
  };

  const handleDeleteDancer = async (dancerId: string) => {
    if (!studioSession) return;
    
    if (!confirm('Are you sure you want to delete this dancer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/studios/dancers?dancerId=${dancerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadDancers(studioSession.id);
      } else {
        setError(data.error || 'Failed to delete dancer');
      }
    } catch (error) {
      console.error('Delete dancer error:', error);
      setError('Failed to delete dancer');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studioSession');
    router.push('/studio-login');
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
          <p className="text-gray-300">Manage your dancers and register for competitions</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Total Dancers</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {dancers.reduce((total, group) => total + group.dancers.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Registrations</h3>
                <p className="text-3xl font-bold text-blue-400">{dancers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Ready to Compete</h3>
                <p className="text-3xl font-bold text-green-400">
                  {dancers.reduce((total, group) => total + group.dancers.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Dancer Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ➕ Add New Dancer
          </button>
        </div>

        {/* Add Dancer Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Add New Dancer</h3>
              <form onSubmit={handleAddDancer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dancer Name *
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    placeholder="Enter dancer's name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={addForm.dateOfBirth}
                    onChange={(e) => setAddForm({...addForm, dateOfBirth: e.target.value})}
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
                    value={addForm.nationalId}
                    onChange={(e) => setAddForm({...addForm, nationalId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    placeholder="Enter national ID"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Dancer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddForm({ name: '', dateOfBirth: '', nationalId: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Dancer Form Modal */}
        {editingDancer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Edit Dancer</h3>
              <form onSubmit={handleUpdateDancer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dancer Name *
                  </label>
                  <input
                    type="text"
                    value={editingDancer.name}
                    onChange={(e) => setEditingDancer({...editingDancer, name: e.target.value})}
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
                    value={editingDancer.dateOfBirth}
                    onChange={(e) => setEditingDancer({...editingDancer, dateOfBirth: e.target.value})}
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
                    value={editingDancer.nationalId}
                    onChange={(e) => setEditingDancer({...editingDancer, nationalId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Update Dancer
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDancer(null)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dancers List */}
        <div className="bg-gray-800/80 rounded-2xl border border-gray-700/20 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Studio Dancers</h3>
            <p className="text-gray-400 text-sm mt-1">Manage your registered dancers</p>
          </div>

          {dancers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-4">No dancers registered yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Dancer
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {dancers.map((group) => (
                group.dancers.map((dancer) => (
                  <div key={dancer.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-semibold text-white mr-3">{dancer.name}</h4>
                          <span className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm font-medium">
                            Age {calculateAge(dancer.dateOfBirth)}
                          </span>
                          {getWaiverStatusBadge(dancer)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">EODSA ID:</span>
                            <span className="text-white ml-2 font-mono">{group.eodsaId}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Date of Birth:</span>
                            <span className="text-white ml-2">{new Date(dancer.dateOfBirth).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">National ID:</span>
                            <span className="text-white ml-2 font-mono">{dancer.nationalId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {calculateAge(dancer.dateOfBirth) < 18 && !dancer.waiver && (
                          <button
                            onClick={() => {
                              setPendingMinorDancer({ id: dancer.id, name: dancer.name });
                              setShowWaiverModal(true);
                            }}
                            className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                          >
                            Add Waiver
                          </button>
                        )}
                        <button
                          onClick={() => setEditingDancer(dancer)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDancer(dancer.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/event-dashboard?eodsaId=${group.eodsaId}`}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Compete
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ))}
            </div>
          )}
        </div>

        {/* Waiver Modal */}
        {showWaiverModal && pendingMinorDancer && (
          <WaiverModal
            isOpen={showWaiverModal}
            onClose={handleWaiverModalClose}
            dancerId={pendingMinorDancer.id}
            dancerName={pendingMinorDancer.name}
            onWaiverSubmitted={handleWaiverSubmitted}
          />
        )}
      </div>
    </div>
  );
} 
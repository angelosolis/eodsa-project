'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateEODSAId, generateStudioRegistrationId } from '@/lib/database';

interface DancerForm {
  name: string;
  age: string;
  dateOfBirth: string;
  nationalId: string;
}

interface GuardianInfo {
  name: string;
  email: string;
  cell: string;
}

interface RegistrationForm {
  type: 'studio' | 'private';
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  guardianInfo?: GuardianInfo;
  privacyPolicyAccepted: boolean;
  studioName: string;
  studioAddress: string;
  studioContactPerson: string;
  dancers: DancerForm[];
}

// Privacy Policy Modal Component
const PrivacyPolicyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">EODSA Privacy Policy (POPIA)</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-gray-300 space-y-4 text-sm">
          <p><strong>Protection of Personal Information Act (POPIA) Notice</strong></p>
          <p>Element of Dance South Africa (EODSA) respects your privacy and is committed to protecting your personal information in accordance with POPIA.</p>
          
          <h3 className="text-white font-semibold">Information We Collect:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Personal details (name, age, contact information)</li>
            <li>Guardian information for minors</li>
            <li>Competition performance data</li>
            <li>Payment information</li>
          </ul>

          <h3 className="text-white font-semibold">How We Use Your Information:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Competition registration and management</li>
            <li>Communication regarding events</li>
            <li>Results and rankings publication</li>
            <li>Compliance with competition regulations</li>
          </ul>

          <h3 className="text-white font-semibold">Your Rights:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of information (subject to legal requirements)</li>
            <li>Objection to processing</li>
          </ul>

          <p>For questions about this policy, contact us at privacy@eodsa.co.za</p>
        </div>
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationForm>({
    type: 'studio',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    guardianInfo: undefined,
    privacyPolicyAccepted: false,
    studioName: '',
    studioAddress: '',
    studioContactPerson: '',
    dancers: [{ name: '', age: '', dateOfBirth: '', nationalId: '' }]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eodsaId, setEodsaId] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Calculate age from date of birth
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

  // Check if person is a minor (under 18)
  const isMinor = (dateOfBirth: string): boolean => {
    if (!dateOfBirth) return false;
    return calculateAge(dateOfBirth) < 18;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Auto-populate dancer information for private registration
      if (prev.type === 'private' && prev.dancers.length > 0) {
        if (name === 'name') {
          newFormData.dancers = [{
            ...prev.dancers[0],
            name: value
          }];
        } else if (name === 'dateOfBirth') {
          newFormData.dancers = [{
            ...prev.dancers[0],
            dateOfBirth: value,
            age: value ? calculateAge(value).toString() : ''
          }];
        }
      }

      // Handle guardian info requirement for minors
      if (name === 'dateOfBirth' && isMinor(value)) {
        newFormData.guardianInfo = newFormData.guardianInfo || { name: '', email: '', cell: '' };
      } else if (name === 'dateOfBirth' && !isMinor(value)) {
        newFormData.guardianInfo = undefined;
      }
      
      return newFormData;
    });
  };

  const handleGuardianChange = (field: keyof GuardianInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      guardianInfo: prev.guardianInfo ? {
        ...prev.guardianInfo,
        [field]: value
      } : { name: '', email: '', cell: '', [field]: value }
    }));
  };

  const handleDancerChange = (index: number, field: keyof DancerForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      dancers: prev.dancers.map((dancer, i) => {
        if (i === index) {
          const updatedDancer = { ...dancer, [field]: value };
          // Auto-calculate age when date of birth changes
          if (field === 'dateOfBirth' && value) {
            updatedDancer.age = calculateAge(value).toString();
          }
          return updatedDancer;
        }
        return dancer;
      })
    }));
  };

  const addDancer = () => {
    setFormData(prev => ({
      ...prev,
      dancers: [...prev.dancers, { name: '', age: '', dateOfBirth: '', nationalId: '' }]
    }));
  };

  const removeDancer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dancers: prev.dancers.filter((_, i) => i !== index)
    }));
  };

  const handleTypeChange = (type: 'studio' | 'private') => {
    setFormData(prev => ({
      ...prev,
      type,
      dancers: type === 'private' 
        ? [{ name: prev.name || '', age: prev.dateOfBirth ? calculateAge(prev.dateOfBirth).toString() : '', dateOfBirth: prev.dateOfBirth || '', nationalId: '' }]
        : prev.dancers.length === 0 
          ? [{ name: '', age: '', dateOfBirth: '', nationalId: '' }] 
          : prev.dancers
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate privacy policy acceptance
      if (!formData.privacyPolicyAccepted) {
        alert('Please accept the Privacy Policy to continue.');
        setIsSubmitting(false);
        return;
      }

      // Validate guardian info for minors
      if (isMinor(formData.dateOfBirth)) {
        if (!formData.guardianInfo?.name || !formData.guardianInfo?.email || !formData.guardianInfo?.cell) {
          alert('Guardian information is required for minors (under 18 years old).');
          setIsSubmitting(false);
          return;
        }
      }

      // Validate dancers
      const validDancers = formData.dancers.filter(dancer => 
        dancer.name && dancer.dateOfBirth && dancer.nationalId
      );
      
      if (validDancers.length === 0) {
        alert('Please add at least one dancer with complete information.');
        setIsSubmitting(false);
        return;
      }

      // Auto-generate Studio Registration Number for studios
      const studioRegistrationNumber = formData.type === 'studio' ? generateStudioRegistrationId() : undefined;

      // Prepare registration data
      const registrationData = {
        name: formData.type === 'studio' ? formData.studioName : formData.name,
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        dateOfBirth: formData.dateOfBirth,
        guardianInfo: formData.guardianInfo,
        privacyPolicyAccepted: formData.privacyPolicyAccepted,
        studioName: formData.type === 'studio' ? formData.studioName : undefined,
        studioInfo: formData.type === 'studio' ? {
          address: formData.studioAddress,
          contactPerson: formData.studioContactPerson,
          registrationNumber: studioRegistrationNumber
        } : undefined,
        dancers: validDancers.map(dancer => ({
          name: dancer.name,
          age: parseInt(dancer.age) || calculateAge(dancer.dateOfBirth),
          dateOfBirth: dancer.dateOfBirth,
          style: 'To be selected per performance', // Remove style from main form
          nationalId: dancer.nationalId
        }))
      };

      const response = await fetch('/api/contestants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        const result = await response.json();
        setEodsaId(result.eodsaId);
        setSubmitted(true);
      } else {
        const error = await response.json();
        alert(`Registration failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full w-20 h-20 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/20 p-8 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Registration Complete! 🎉
            </h2>
            
            {/* E-O-D-S-A ID Display */}
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30 rounded-2xl p-6 mb-8">
              <div className="text-sm font-medium text-purple-300 mb-2">Your E-O-D-S-A ID</div>
              <div className="text-2xl font-bold text-white mb-2 font-mono tracking-wider">{eodsaId}</div>
              <div className="text-xs text-purple-400">⚠️ Save this ID - you'll need it for event entries</div>
            </div>
            
            <p className="text-gray-300 mb-8 leading-relaxed">
              Congratulations! You're now registered in the E-O-D-S-A competition system. 
              Use your ID to enter competitions and track your performances.
            </p>
            
            <div className="space-y-4">
              <Link 
                href={`/event-dashboard?eodsaId=${eodsaId}`}
                className="block w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🎪 Enter Your First Competition
              </Link>
              
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEodsaId('');
                  setFormData({
                    type: 'studio',
                    name: '',
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    guardianInfo: undefined,
                    privacyPolicyAccepted: false,
                    studioName: '',
                    studioAddress: '',
                    studioContactPerson: '',
                    dancers: [{ name: '', age: '', dateOfBirth: '', nationalId: '' }]
                  });
                }}
                className="block w-full px-6 py-4 border-2 border-gray-600 text-gray-300 rounded-2xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 font-semibold"
              >
                ➕ Register Another Contestant
              </button>
              
              <Link 
                href="/" 
                className="block w-full px-6 py-4 border-2 border-gray-600 text-gray-300 rounded-2xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 font-semibold"
              >
                🏠 Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent)] "></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
              
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Join EODSA
            </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Register your dancers and become part of South Africa's premier dance competition community.
            </p>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/20 p-6 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Registration Type Toggle */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-6">Choose Registration Type</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('studio')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        formData.type === 'studio'
                          ? 'border-purple-500 bg-purple-900/30 shadow-lg scale-105'
                          : 'border-gray-600 bg-gray-700/50 hover:border-purple-400 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${
                          formData.type === 'studio' ? 'bg-purple-500' : 'bg-gray-500 group-hover:bg-purple-400'
                        }`}>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-white">Dance Studio</h4>
                        <p className="text-sm text-gray-300">Register multiple dancers from your studio</p>
              </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('private')}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                        formData.type === 'private'
                          ? 'border-pink-500 bg-pink-900/30 shadow-lg scale-105'
                          : 'border-gray-600 bg-gray-700/50 hover:border-pink-400 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${
                          formData.type === 'private' ? 'bg-pink-500' : 'bg-gray-500 group-hover:bg-pink-400'
                        }`}>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-2 text-white">Individual Dancer</h4>
                        <p className="text-sm text-gray-300">Register as a private contestant</p>
                      </div>
                    </button>
                  </div>
              </div>

                {/* Contact Information */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                  required
                />
              </div>
                    <div className="relative">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                  required
                />
                    </div>
                    
                    {/* Date of Birth Field */}
                    <div className="relative">
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white"
                        required
                      />
                      {formData.dateOfBirth && (
                        <p className="text-xs text-gray-400 mt-1">
                          Age: {calculateAge(formData.dateOfBirth)} years old
                        </p>
                      )}
                    </div>
                    
                    {/* Show message if minor */}
                    {isMinor(formData.dateOfBirth) && (
                      <div className="md:col-span-2">
                        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L1.998 19.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-yellow-300 font-medium">Guardian Required</span>
                          </div>
                          <p className="text-yellow-200 text-sm mt-1">
                            As you are under 18, a parent or guardian must complete this registration.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Guardian Information for Minors */}
                  {isMinor(formData.dateOfBirth) && (
                    <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        Parent/Guardian Information *
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Guardian Name *
                          </label>
                          <input
                            type="text"
                            value={formData.guardianInfo?.name || ''}
                            onChange={(e) => handleGuardianChange('name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-white placeholder-gray-400"
                            required={isMinor(formData.dateOfBirth)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Guardian Email *
                          </label>
                          <input
                            type="email"
                            value={formData.guardianInfo?.email || ''}
                            onChange={(e) => handleGuardianChange('email', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-white placeholder-gray-400"
                            required={isMinor(formData.dateOfBirth)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Guardian Cell *
                          </label>
                          <input
                            type="tel"
                            value={formData.guardianInfo?.cell || ''}
                            onChange={(e) => handleGuardianChange('cell', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-white placeholder-gray-400"
                            required={isMinor(formData.dateOfBirth)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
              </div>

                {/* Studio Information (if studio type) */}
              {formData.type === 'studio' && (
                  <div className="bg-purple-900/20 rounded-2xl p-6 border border-purple-500/30">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Studio Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studioName" className="block text-sm font-medium text-gray-300 mb-2">
                    Studio Name *
                  </label>
                  <input
                    type="text"
                    id="studioName"
                    name="studioName"
                    value={formData.studioName}
                    onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                          required={formData.type === 'studio'}
                        />
                      </div>
                      <div>
                        <label htmlFor="studioContactPerson" className="block text-sm font-medium text-gray-300 mb-2">
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          id="studioContactPerson"
                          name="studioContactPerson"
                          value={formData.studioContactPerson}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                          required={formData.type === 'studio'}
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <label htmlFor="studioAddress" className="block text-sm font-medium text-gray-300 mb-2">
                        Studio Address *
                      </label>
                      <input
                        type="text"
                        id="studioAddress"
                        name="studioAddress"
                        value={formData.studioAddress}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-400"
                    required={formData.type === 'studio'}
                  />
                    </div>
                    <div className="mt-6">
                      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-300 font-medium">Auto-Generated ID</span>
                        </div>
                        <p className="text-green-200 text-sm mt-1">
                          Your Studio Registration Number will be automatically generated upon registration.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Private Registration Name */}
                {formData.type === 'private' && (
                  <div className="bg-pink-900/20 rounded-2xl p-6 border border-pink-500/30">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personal Details
                    </h3>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-white placeholder-gray-400"
                        required={formData.type === 'private'}
                      />
                    </div>
                </div>
              )}

                {/* Dancers Section */}
                <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/30">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {formData.type === 'studio' ? 'Studio Dancers' : 'Dancer Information'}
                      </h3>
                      {formData.type === 'private' && (
                        <p className="text-sm text-gray-400 mt-1">
                          Complete your dancer profile for competition registration
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mt-1">
                        ℹ️ Dance styles will be selected per performance entry
                      </p>
                    </div>
                    {formData.type === 'studio' && (
                      <button
                        type="button"
                        onClick={addDancer}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        ➕ Add Dancer
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {formData.dancers.map((dancer, index) => (
                      <div key={index} className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-white flex items-center">
                            <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                              {index + 1}
                            </span>
                            {formData.type === 'studio' ? `Dancer ${index + 1}` : 'Your Information'}
                          </h4>
                          {formData.type === 'studio' && formData.dancers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDancer(index)}
                              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full Name *
                            </label>
                            {formData.type === 'private' ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={dancer.name}
                                  className="w-full px-4 py-3 border border-gray-600 bg-gray-600 rounded-xl text-gray-300 cursor-not-allowed"
                                  readOnly
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={dancer.name}
                                onChange={(e) => handleDancerChange(index, 'name', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-gray-400"
                                required
                              />
                            )}
                            {formData.type === 'private' && (
                              <p className="text-xs text-gray-400 mt-1">
                                💡 Auto-filled from your personal details above
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Age *
                            </label>
                            <input
                              type="number"
                              min="3"
                              max="99"
                              value={dancer.age}
                              onChange={(e) => handleDancerChange(index, 'age', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-gray-400"
                              required
                              readOnly={formData.type === 'private'}
                            />
                            {formData.type === 'private' && (
                              <p className="text-xs text-gray-400 mt-1">
                                💡 Auto-calculated from date of birth
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Date of Birth *
                            </label>
                            <input
                              type="date"
                              value={dancer.dateOfBirth}
                              onChange={(e) => handleDancerChange(index, 'dateOfBirth', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                              required
                              readOnly={formData.type === 'private'}
                            />
                            {formData.type === 'private' && (
                              <p className="text-xs text-gray-400 mt-1">
                                💡 Auto-filled from your personal details above
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              National ID Number *
                            </label>
                            <input
                              type="text"
                              value={dancer.nationalId}
                              onChange={(e) => handleDancerChange(index, 'nationalId', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-gray-400"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Policy Checkbox */}
                <div className="bg-gray-700/50 rounded-2xl p-6 border border-gray-600">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="privacyPolicyAccepted"
                      name="privacyPolicyAccepted"
                      checked={formData.privacyPolicyAccepted}
                      onChange={handleInputChange}
                      className="mt-1 w-5 h-5 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      required
                    />
                    <label htmlFor="privacyPolicyAccepted" className="text-sm text-gray-300">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-purple-400 hover:text-purple-300 underline transition-colors"
                      >
                        EODSA Privacy Policy (POPIA)
                      </button>
                      {' '}*
                    </label>
                  </div>
                  {!formData.privacyPolicyAccepted && (
                    <p className="text-red-400 text-xs mt-2">
                      You must accept the Privacy Policy to continue.
                    </p>
                  )}
                </div>

              {/* Submit Button */}
                <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.privacyPolicyAccepted}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-3 border-white/30 rounded-full animate-spin border-t-white"></div>
                      </div>
                      <span>Creating Your EODSA Profile...</span>
                    </div>
                  ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Complete Registration & Get EODSA ID
                      </span>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
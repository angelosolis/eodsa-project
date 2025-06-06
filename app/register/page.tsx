'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RecaptchaV2 } from '@/components/RecaptchaV2';
import { generateEODSAId } from '@/lib/database';
import { useToast } from '@/components/ui/simple-toast';

interface GuardianInfo {
  name: string;
  email: string;
  cell: string;
}

interface RegistrationForm {
  type: 'individual_dancer';
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  guardianInfo?: GuardianInfo;
  privacyPolicyAccepted: boolean;
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
    type: 'individual_dancer',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationalId: '',
    guardianInfo: undefined,
    privacyPolicyAccepted: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eodsaId, setEodsaId] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const { success, error, warning, info } = useToast();

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

    // Validate National ID to only accept numbers
    if (name === 'nationalId') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Limit to 13 digits (South African ID length)
      const limitedValue = numericValue.slice(0, 13);
      
      setFormData(prev => {
        const newFormData = { ...prev, [name]: limitedValue };
        return newFormData;
      });
      return;
    }

    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate privacy policy acceptance
      if (!formData.privacyPolicyAccepted) {
        warning('Please accept the Privacy Policy to continue with registration.', 6000);
        setIsSubmitting(false);
        return;
      }

      // Validate individual dancer fields
      if (!formData.name || !formData.dateOfBirth || !formData.nationalId) {
        warning('Name, date of birth, and national ID are required for dancer registration.', 6000);
        setIsSubmitting(false);
        return;
      }

      // Validate guardian info for minors
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        if (!formData.guardianInfo?.name || !formData.guardianInfo?.email || !formData.guardianInfo?.cell) {
          warning('Complete guardian information is required for dancers under 18 years old.', 7000);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate reCAPTCHA
      if (!recaptchaToken) {
        warning('Please complete the security verification (reCAPTCHA).', 5000);
        setIsSubmitting(false);
        return;
      }

      info('Creating your dancer profile...', 3000);

      // Register individual dancer
      const response = await fetch('/api/dancers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          nationalId: formData.nationalId,
          email: formData.email,
          phone: formData.phone,
          guardianName: formData.guardianInfo?.name,
          guardianEmail: formData.guardianInfo?.email,
          guardianPhone: formData.guardianInfo?.cell,
          recaptchaToken: recaptchaToken
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEodsaId(result.dancer.eodsaId);
        success(`Welcome to EODSA! Your dancer ID is ${result.dancer.eodsaId}`, 8000);
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        
        // Handle specific error types
        if (errorData.rateLimited) {
          const resetTime = new Date(errorData.resetTime).toLocaleTimeString();
          error(`⏰ Rate limit exceeded! You can only register 3 accounts per hour. Please try again after ${resetTime}.`, 8000);
        } else if (errorData.recaptchaFailed) {
          error(`🔒 Security verification failed. Please refresh the page and try again.`, 6000);
        } else {
          error(errorData.error || 'Unable to complete registration. Please try again.', 8000);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      error('Unable to connect to registration service. Please check your connection and try again.', 8000);
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
              Your dancer registration is now <strong>active</strong>! You can immediately start 
              participating in competitions and applying to dance studios.
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-300 font-medium">Next Steps</span>
                </div>
                <p className="text-blue-200 text-sm mt-1">
                  1. Wait for admin approval (you'll be notified)<br/>
                  2. Once approved, browse and apply to dance studios<br/>
                  3. Studios will review and accept/reject your application
                </p>
              </div>
              <Link 
                href={`/event-dashboard?eodsaId=${eodsaId}`}
                className="block w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🎪 Enter Your First Competition
              </Link>
              
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEodsaId('');
                  setFormData({
                    type: 'individual_dancer',
                    name: '',
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    nationalId: '',
                    guardianInfo: undefined,
                    privacyPolicyAccepted: false,
                  });
                }}
                className="block w-full px-6 py-4 border-2 border-gray-600 text-gray-300 rounded-2xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-300 font-semibold"
              >
                ➕ Register Another Dancer
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

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 lg:p-12">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Registration Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Create Your Dancer Profile</h3>
                  <p className="text-lg text-gray-300 mb-6">Get instant access to competitions and studio applications</p>
                  
                  {/* Progress Indicators */}
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">1</div>
                      <span className="ml-2 text-sm text-emerald-300">Fill Details</span>
                    </div>
                    <div className="w-8 h-px bg-gray-600"></div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-400 text-sm font-semibold">2</div>
                      <span className="ml-2 text-sm text-gray-400">Verify Identity</span>
                    </div>
                    <div className="w-8 h-px bg-gray-600"></div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-400 text-sm font-semibold">3</div>
                      <span className="ml-2 text-sm text-gray-400">Get EODSA ID</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 max-w-md mx-auto">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h-2m2.5-9l2.5 2.5L15 8" />
                      </svg>
                      <span className="text-blue-300 font-medium text-sm">Studios register separately via Studio Portal</span>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                      </div>
                      Personal Information
                  </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-white mb-3">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-300 text-lg"
                          placeholder="Enter your full name"
                        required={formData.type === 'individual_dancer'}
                      />
                    </div>
                    <div>
                        <label htmlFor="nationalId" className="block text-sm font-semibold text-white mb-3">
                        National ID Number *
                      </label>
                      <input
                        type="text"
                        id="nationalId"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-300 text-lg"
                        placeholder="13 digit ID number"
                        pattern="[0-9]{13}"
                        maxLength={13}
                        inputMode="numeric"
                        title="Please enter exactly 13 digits"
                        required={formData.type === 'individual_dancer'}
                      />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Personal Details */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                      </div>
                      Contact & Personal Details
                  </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-white mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-gray-300 text-lg"
                          placeholder="your@email.com"
                  required
                />
              </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-white mb-3">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-gray-300 text-lg"
                          placeholder="081 234 5678"
                  required
                />
                    </div>
                    
                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-white mb-3">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                          className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white text-lg"
                        required
                      />
                      {formData.dateOfBirth && (
                          <p className="text-sm text-blue-300 mt-2 font-medium">
                          Age: {calculateAge(formData.dateOfBirth)} years old
                        </p>
                      )}
                      </div>
                    </div>
                    </div>
                    
                    {/* Show message if minor */}
                    {isMinor(formData.dateOfBirth) && (
                    <div className="mt-8">
                        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L1.998 19.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-yellow-300 font-medium">Guardian Required</span>
                          </div>
                          <p className="text-yellow-200 text-sm mt-1">
                            Parent/Guardian Consent Required ⚠️ Under 18, a parent or guardian must complete this registration.
                          </p>
                        </div>
                      </div>
                    )}
                  
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

                {/* Privacy Policy & Security */}
                <div className="space-y-8">
                {/* Privacy Policy Checkbox */}
                  <div className="flex items-start space-x-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <input
                      type="checkbox"
                      id="privacyPolicyAccepted"
                      name="privacyPolicyAccepted"
                      checked={formData.privacyPolicyAccepted}
                      onChange={handleInputChange}
                      className="mt-1 w-6 h-6 text-purple-500 bg-white/10 border-white/20 rounded-lg focus:ring-purple-500 focus:ring-2"
                      required
                    />
                    <label htmlFor="privacyPolicyAccepted" className="text-white">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-purple-400 hover:text-purple-300 underline transition-colors font-semibold"
                      >
                        EODSA Privacy Policy (POPIA)
                      </button>
                      {' '}*
                    </label>
                </div>

              {/* reCAPTCHA */}
                  <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white">Security Verification</h3>
                    </div>
                    <p className="text-gray-300 text-lg mb-6">Please verify you're human to complete registration</p>
                  <RecaptchaV2
                    onVerify={(token) => setRecaptchaToken(token)}
                    onExpire={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                    theme="dark"
                    size="normal"
                  />
                  {!recaptchaToken && (
                      <p className="text-red-400 text-sm mt-4">
                      Please complete the security verification above.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
                <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.privacyPolicyAccepted || !recaptchaToken}
                    className="w-full px-8 py-6 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105"
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
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Create My EODSA Profile
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
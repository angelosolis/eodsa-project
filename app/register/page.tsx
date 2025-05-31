'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DANCE_STYLES } from '@/lib/types';

interface DancerForm {
  name: string;
  age: string;
  style: string;
  nationalId: string;
}

interface RegistrationForm {
  type: 'studio' | 'private';
  name: string;
  email: string;
  phone: string;
  studioName: string;
  studioAddress: string;
  studioContactPerson: string;
  studioRegistrationNumber: string;
  dancers: DancerForm[];
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationForm>({
    type: 'studio',
    name: '',
    email: '',
    phone: '',
    studioName: '',
    studioAddress: '',
    studioContactPerson: '',
    studioRegistrationNumber: '',
    dancers: [{ name: '', age: '', style: '', nationalId: '' }]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eodsaId, setEodsaId] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDancerChange = (index: number, field: keyof DancerForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      dancers: prev.dancers.map((dancer, i) => 
        i === index ? { ...dancer, [field]: value } : dancer
      )
    }));
  };

  const addDancer = () => {
    setFormData(prev => ({
      ...prev,
      dancers: [...prev.dancers, { name: '', age: '', style: '', nationalId: '' }]
    }));
  };

  const removeDancer = (index: number) => {
    if (formData.dancers.length > 1) {
      setFormData(prev => ({
        ...prev,
        dancers: prev.dancers.filter((_, i) => i !== index)
      }));
    }
  };

  const handleTypeChange = (type: 'studio' | 'private') => {
    setFormData(prev => ({
      ...prev,
      type,
      dancers: type === 'private' ? [{ name: '', age: '', style: '', nationalId: '' }] : prev.dancers
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate dancers
      const validDancers = formData.dancers.filter(dancer => 
        dancer.name && dancer.age && dancer.style && dancer.nationalId
      );
      
      if (validDancers.length === 0) {
        alert('Please add at least one dancer with complete information.');
        setIsSubmitting(false);
        return;
      }

      // Prepare registration data
      const registrationData = {
        name: formData.type === 'studio' ? formData.studioName : formData.name,
        email: formData.email,
        phone: formData.phone,
        type: formData.type,
        studioName: formData.type === 'studio' ? formData.studioName : undefined,
        studioInfo: formData.type === 'studio' ? {
          address: formData.studioAddress,
          contactPerson: formData.studioContactPerson,
          registrationNumber: formData.studioRegistrationNumber
        } : undefined,
        dancers: validDancers.map(dancer => ({
          name: dancer.name,
          age: parseInt(dancer.age),
          style: dancer.style,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">Your E-O-D-S-A ID:</p>
              <p className="text-lg font-bold text-blue-900">{eodsaId}</p>
              <p className="text-xs text-blue-600 mt-1">Please save this ID for future reference</p>
            </div>
            <p className="text-gray-600 mb-6">
              Thank you for registering. You can now proceed to enter events using your E-O-D-S-A ID.
            </p>
            <div className="space-y-3">
              <Link 
                href={`/event-entry?eodsaId=${eodsaId}`}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Enter Event Now
              </Link>
              <Link 
                href="/register" 
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                onClick={() => {
                  setSubmitted(false);
                  setEodsaId('');
                  setFormData({
                    type: 'studio',
                    name: '',
                    email: '',
                    phone: '',
                    studioName: '',
                    studioAddress: '',
                    studioContactPerson: '',
                    studioRegistrationNumber: '',
                    dancers: [{ name: '', age: '', style: '', nationalId: '' }]
                  });
                }}
              >
                Register Another Contestant
              </Link>
              <Link 
                href="/" 
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contestant Registration
            </h1>
            <p className="text-xl text-gray-600">
              Register for the E-O-D-S-A competition and receive your permanent ID.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Registration Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Registration Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('studio')}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-colors ${
                      formData.type === 'studio'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">Studio Registration</div>
                      <div className="text-sm">Register multiple dancers from your studio</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('private')}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-colors ${
                      formData.type === 'private'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">Private Registration</div>
                      <div className="text-sm">Register as an individual dancer</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Studio Information (if studio type) */}
              {formData.type === 'studio' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Studio Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="studioName" className="block text-sm font-medium text-gray-700 mb-2">
                        Studio Name *
                      </label>
                      <input
                        type="text"
                        id="studioName"
                        name="studioName"
                        value={formData.studioName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={formData.type === 'studio'}
                      />
                    </div>
                    <div>
                      <label htmlFor="studioContactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        id="studioContactPerson"
                        name="studioContactPerson"
                        value={formData.studioContactPerson}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={formData.type === 'studio'}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="studioAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Studio Address *
                    </label>
                    <input
                      type="text"
                      id="studioAddress"
                      name="studioAddress"
                      value={formData.studioAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={formData.type === 'studio'}
                    />
                  </div>
                  <div>
                    <label htmlFor="studioRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Studio Registration Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="studioRegistrationNumber"
                      name="studioRegistrationNumber"
                      value={formData.studioRegistrationNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Private Registration Name */}
              {formData.type === 'private' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={formData.type === 'private'}
                  />
                </div>
              )}

              {/* Dancers Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formData.type === 'studio' ? 'Dancers' : 'Dancer Information'}
                  </h3>
                  {formData.type === 'studio' && (
                    <button
                      type="button"
                      onClick={addDancer}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Dancer
                    </button>
                  )}
                </div>

                {formData.dancers.map((dancer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">
                        {formData.type === 'studio' ? `Dancer ${index + 1}` : 'Your Information'}
                      </h4>
                      {formData.type === 'studio' && formData.dancers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDancer(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={dancer.name}
                          onChange={(e) => handleDancerChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Age *
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="99"
                          value={dancer.age}
                          onChange={(e) => handleDancerChange(index, 'age', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Dance Style *
                        </label>
                        <select
                          value={dancer.style}
                          onChange={(e) => handleDancerChange(index, 'style', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select a style</option>
                          {DANCE_STYLES.map(style => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          National ID Number *
                        </label>
                        <input
                          type="text"
                          value={dancer.nationalId}
                          onChange={(e) => handleDancerChange(index, 'nationalId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </div>
                  ) : (
                    'Complete Registration & Get E-O-D-S-A ID'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 
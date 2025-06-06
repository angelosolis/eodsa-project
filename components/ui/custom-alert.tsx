'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AlertContextType {
  showAlert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  showPrompt: (message: string, onConfirm: (value: string) => void, onCancel?: () => void, placeholder?: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt';
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  inputValue: string;
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'alert',
    variant: 'info',
    message: '',
    inputValue: ''
  });

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertState({
      isOpen: true,
      type: 'alert',
      variant: type,
      message,
      inputValue: ''
    });
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
    setAlertState({
      isOpen: true,
      type: 'confirm',
      variant: 'warning',
      message,
      onConfirm: () => onConfirm(),
      onCancel,
      inputValue: ''
    });
  }, []);

  const showPrompt = useCallback((message: string, onConfirm: (value: string) => void, onCancel?: () => void, placeholder?: string) => {
    setAlertState({
      isOpen: true,
      type: 'prompt',
      variant: 'info',
      message,
      onConfirm: (value?: string) => onConfirm(value || ''),
      onCancel,
      placeholder,
      inputValue: ''
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (alertState.onConfirm) {
      if (alertState.type === 'prompt') {
        alertState.onConfirm(alertState.inputValue);
      } else {
        alertState.onConfirm();
      }
    }
    closeAlert();
  }, [alertState, closeAlert]);

  const handleCancel = useCallback(() => {
    if (alertState.onCancel) {
      alertState.onCancel();
    }
    closeAlert();
  }, [alertState, closeAlert]);

  if (!alertState.isOpen) {
    return (
      <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
        {children}
      </AlertContext.Provider>
    );
  }

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
             {/* Simple Modal Overlay */}
       <div 
         className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-20 flex items-center justify-center z-50 p-4"
         onClick={alertState.type === 'alert' ? closeAlert : undefined}
       >
        {/* Simple Card Modal */}
        <div 
          className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {alertState.type === 'confirm' ? 'Confirm Action' : 
             alertState.type === 'prompt' ? 'Input Required' : 
             alertState.variant === 'success' ? 'Success' :
             alertState.variant === 'error' ? 'Error' :
             alertState.variant === 'warning' ? 'Warning' : 'Information'}
          </h2>
          
          {/* Message */}
          <p className="text-gray-600 mb-6">
            {alertState.message}
          </p>
          
          {/* Input field for prompt */}
          {alertState.type === 'prompt' && (
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 text-gray-900 placeholder-gray-500"
              placeholder={alertState.placeholder || 'Enter value...'}
              value={alertState.inputValue}
              onChange={(e) => setAlertState(prev => ({ ...prev, inputValue: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && alertState.inputValue?.trim()) {
                  handleConfirm();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              autoFocus
            />
          )}
          
          {/* Buttons */}
          <div className="flex space-x-3">
            {/* Cancel/Close Button */}
            {(alertState.type === 'confirm' || alertState.type === 'prompt') && (
              <button
                type="button"
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
            
            {/* Confirm/OK Button */}
            <button
              type="button"
              className={`flex-1 px-4 py-2 text-white rounded-md font-medium transition-colors ${
                alertState.variant === 'success' ? 'bg-green-600 hover:bg-green-700' :
                alertState.variant === 'error' ? 'bg-red-600 hover:bg-red-700' :
                alertState.variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-blue-600 hover:bg-blue-700'
              } ${alertState.type === 'prompt' && !alertState.inputValue?.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleConfirm}
              disabled={alertState.type === 'prompt' && !alertState.inputValue?.trim()}
            >
              {alertState.type === 'confirm' ? 'Confirm' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </AlertContext.Provider>
  );
}; 
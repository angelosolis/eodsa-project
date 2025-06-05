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

  const getIcon = () => {
    switch (alertState.variant) {
      case 'success':
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
        );
    }
  };

  const getTitleColor = () => {
    switch (alertState.variant) {
      case 'success': return 'text-green-900';
      case 'error': return 'text-red-900';
      case 'warning': return 'text-yellow-900';
      default: return 'text-blue-900';
    }
  };

  const getButtonColor = () => {
    switch (alertState.variant) {
      case 'success': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'error': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      {/* Modal Overlay */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={alertState.type === 'alert' ? closeAlert : undefined}
            ></div>

            {/* Center the modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                {/* Icon */}
                {getIcon()}
                
                {/* Content */}
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className={`text-lg leading-6 font-medium ${getTitleColor()}`}>
                    {alertState.type === 'confirm' ? 'Confirm Action' : 
                     alertState.type === 'prompt' ? 'Input Required' : 
                     alertState.variant === 'success' ? 'Success' :
                     alertState.variant === 'error' ? 'Error' :
                     alertState.variant === 'warning' ? 'Warning' : 'Information'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {alertState.message}
                    </p>
                  </div>
                  
                  {/* Input field for prompt */}
                  {alertState.type === 'prompt' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    </div>
                  )}
                </div>
              </div>
              
              {/* Buttons */}
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                {/* Confirm/OK Button */}
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${getButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleConfirm}
                  disabled={alertState.type === 'prompt' && !alertState.inputValue?.trim()}
                >
                  {alertState.type === 'confirm' ? 'Confirm' : 'OK'}
                </button>
                
                {/* Cancel Button (only for confirm and prompt) */}
                {(alertState.type === 'confirm' || alertState.type === 'prompt') && (
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}; 
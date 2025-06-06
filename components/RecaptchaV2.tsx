import { useEffect, useRef, useState } from 'react';

interface RecaptchaV2Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad?: () => void;
  }
}

export const RecaptchaV2 = ({ 
  onVerify, 
  onExpire, 
  onError, 
  theme = 'dark', 
  size = 'normal' 
}: RecaptchaV2Props) => {
  const captchaRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadRecaptcha = () => {
      // Prevent multiple renders and ensure element exists
      if (isRendering || !captchaRef.current || widgetId !== null) {
        return;
      }

      if (window.grecaptcha && window.grecaptcha.render) {
        setIsRendering(true);
        
        try {
          // Ensure the container is clean and visible
          const container = captchaRef.current;
          if (!container) {
            setIsRendering(false);
            return;
          }

          // Clear any existing content
          container.innerHTML = '';
          
          // Add a small delay to ensure DOM is ready
          setTimeout(() => {
            if (!isMounted || !container || widgetId !== null) {
              setIsRendering(false);
              return;
            }

            try {
              const id = window.grecaptcha.render(container, {
                sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
                callback: (token: string) => {
                  if (isMounted) {
                    onVerify(token);
                  }
                },
                'expired-callback': () => {
                  if (isMounted && onExpire) {
                    onExpire();
                  }
                },
                'error-callback': () => {
                  if (isMounted && onError) {
                    onError();
                  }
                },
                theme: theme,
                size: size
              });
              
              if (isMounted) {
                setWidgetId(id);
                setIsLoaded(true);
              }
            } catch (error) {
              console.error('Error rendering reCAPTCHA:', error);
              if (isMounted && onError) {
                onError();
              }
            } finally {
              setIsRendering(false);
            }
          }, 100);
        } catch (error) {
          console.error('Error preparing reCAPTCHA:', error);
          setIsRendering(false);
          if (onError) {
            onError();
          }
        }
      }
    };

    if (window.grecaptcha && window.grecaptcha.render) {
      loadRecaptcha();
    } else {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        
        // Global callback
        window.onRecaptchaLoad = () => {
          if (isMounted) {
            loadRecaptcha();
          }
        };

        script.onerror = () => {
          console.error('Failed to load reCAPTCHA script');
          if (isMounted && onError) {
            onError();
          }
        };

        document.head.appendChild(script);
      } else {
        // Script exists, wait for it to be ready
        const checkLoaded = () => {
          if (!isMounted) return;
          
          if (window.grecaptcha && window.grecaptcha.render) {
            loadRecaptcha();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      }
    }

    return () => {
      isMounted = false;
      
      // Cleanup widget
      if (widgetId !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetId);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []); // Only run once on mount

  const reset = () => {
    if (widgetId !== null && window.grecaptcha && captchaRef.current) {
      try {
        window.grecaptcha.reset(widgetId);
      } catch (e) {
        console.error('Error resetting reCAPTCHA:', e);
      }
    }
  };

  const getResponse = () => {
    if (widgetId !== null && window.grecaptcha) {
      try {
        return window.grecaptcha.getResponse(widgetId);
      } catch (e) {
        console.error('Error getting reCAPTCHA response:', e);
        return '';
      }
    }
    return '';
  };

  return (
    <div className="flex justify-center">
      <div 
        ref={captchaRef} 
        style={{ minHeight: '78px', minWidth: '304px' }}
      />
    </div>
  );
};

export { RecaptchaV2 as default }; 
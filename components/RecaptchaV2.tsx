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

  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.render && captchaRef.current) {
        // Clear any existing content first
        if (captchaRef.current.hasChildNodes()) {
          captchaRef.current.innerHTML = '';
        }
        
        // Only render if we don't have a widget ID yet
        if (widgetId === null) {
          try {
            const id = window.grecaptcha.render(captchaRef.current, {
              sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
              callback: onVerify,
              'expired-callback': onExpire,
              'error-callback': onError,
              theme: theme,
              size: size
            });
            setWidgetId(id);
            setIsLoaded(true);
          } catch (error) {
            console.error('Error rendering reCAPTCHA:', error);
          }
        }
      }
    };

    if (window.grecaptcha && window.grecaptcha.render) {
      loadRecaptcha();
    } else {
      // Only add script if it doesn't exist
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        
        window.onRecaptchaLoad = () => {
          loadRecaptcha();
        };

        document.head.appendChild(script);
      } else {
        // Script exists, just wait for it to load
        const checkLoaded = () => {
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
      // Cleanup function
      if (widgetId !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetId);
        } catch (e) {
          console.log('Error resetting reCAPTCHA:', e);
        }
      }
    };
  }, []);  // Remove dependencies to prevent re-rendering

  // Update callbacks when they change
  useEffect(() => {
    if (widgetId !== null && window.grecaptcha && captchaRef.current) {
      // Re-render with new callbacks if needed
      try {
        window.grecaptcha.reset(widgetId);
      } catch (e) {
        // Ignore reset errors
      }
    }
  }, [onVerify, onExpire, onError, widgetId]);

  const reset = () => {
    if (widgetId !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetId);
    }
  };

  const getResponse = () => {
    if (widgetId !== null && window.grecaptcha) {
      return window.grecaptcha.getResponse(widgetId);
    }
    return '';
  };

  return (
    <div className="flex justify-center">
      <div ref={captchaRef} />
    </div>
  );
};

export { RecaptchaV2 as default }; 
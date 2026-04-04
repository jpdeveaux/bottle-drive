import { ReactNode, SubmitEvent, useCallback } from 'react';
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface CaptchaFormProps {
  formSubmit: (event: SubmitEvent<HTMLFormElement>, recaptchaToken: string | undefined) => void;
  setStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void;
  className: string;
  children: ReactNode;
}

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export const CaptchaForm = ({ formSubmit, setStatus, className, children }: CaptchaFormProps) => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = useCallback(async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    let captchaToken: string | undefined = undefined;

    if (!executeRecaptcha) {
      console.warn("reCAPTCHA has not yet loaded.");
      return;
    }

    try {
      setStatus('loading');
      captchaToken = await executeRecaptcha('address_submit');
    } catch (error) {
      setStatus('error');
      console.error("reCAPTCHA execution failed:", error);
    }

    // Pass the original event and the generated token to your handler
    formSubmit(event, captchaToken);
  }, [executeRecaptcha, formSubmit, setStatus]);

  return <form onSubmit={(siteKey ? handleSubmit : (e) => formSubmit(e, undefined))} className={className}>{children}</form>;
};

export const CaptchaWrapper = ({ children }: { children: ReactNode }) => {

  // If no key, just return the app content directly
  if (!siteKey) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
};

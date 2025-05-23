
import React, { useEffect, useRef } from 'react';

interface LoginScreenProps {
  isGoogleAuthInitialized: boolean;
  googleClientIdWarning: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ isGoogleAuthInitialized, googleClientIdWarning }) => {
  const googleSignInButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGoogleAuthInitialized && googleSignInButtonRef.current) {
      // Clear previous button to avoid duplicates if this effect re-runs
      while (googleSignInButtonRef.current.firstChild) {
        if (googleSignInButtonRef.current.firstChild) { // Check again before removing
           googleSignInButtonRef.current.removeChild(googleSignInButtonRef.current.firstChild);
        }
      }
      try {
         if (window.google && window.google.accounts && window.google.accounts.id) {
            window.google.accounts.id.renderButton(
                googleSignInButtonRef.current,
                { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', logo_alignment: 'left', width: '280px' } 
            );
            // Attempt One Tap prompt (will use iframe fallback if use_fedcm_for_prompt is false in App.tsx initialize)
            window.google.accounts.id.prompt((notification: any) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // console.debug('Google One Tap prompt was not displayed or skipped:', notification.getNotDisplayedReason() || notification.getSkippedReason());
              }
            });
        }
      } catch (error) {
        console.error("Error rendering Google Sign-In button or prompt on LoginScreen:", error);
      }
    }
  }, [isGoogleAuthInitialized]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-indigo-900 text-indigo-100 font-rajdhani">
      <div className="bg-indigo-800 bg-opacity-60 p-8 sm:p-10 md:p-14 rounded-xl shadow-2xl w-full max-w-lg text-center border-2 border-orange-500 border-opacity-40">
        <div className="mb-6 text-center">
            <i className="fas fa-dragon text-6xl text-orange-400 p-3 bg-orange-500 bg-opacity-20 rounded-full shadow-lg" 
               style={{ textShadow: '0 0 10px rgba(251, 146, 60, 0.7)'}}></i>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-orange-400 tracking-wider title-animated mb-6">
          Dokkan Battle Patch Maker
        </h1>
        <p className="text-indigo-200 text-md sm:text-lg mb-10">
          Please sign in with Google to continue.
        </p>
        
        <div className="flex justify-center my-8">
            <div id="googleSignInButtonContainerLoginScreen" ref={googleSignInButtonRef} className="min-h-[50px] flex items-center justify-center">
              {!isGoogleAuthInitialized && 
                <div className="text-sm text-indigo-300 flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2 text-lg"></i>
                    Loading Sign-In options...
                </div>
              }
            </div>
        </div>

        {googleClientIdWarning && (
          <p className="text-yellow-400 text-xs mt-8 bg-yellow-900 bg-opacity-70 p-3 rounded-md shadow-inner">
            <i className="fas fa-exclamation-triangle mr-1.5"></i> 
            Developer Note: Google Sign-In requires a valid Client ID. 
            Please replace the placeholder in App.tsx for full functionality.
          </p>
        )}
      </div>
      <footer className="absolute bottom-4 text-center w-full text-xs text-indigo-400 opacity-80">
        <p>&copy; {new Date().getFullYear()} Dokkan Patch Maker. For personal and educational use.</p>
      </footer>
    </div>
  );
};

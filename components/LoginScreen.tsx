import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import * as authService from '../services/authService';
import { FormInput } from './FormControls'; // Assuming FormInput handles general input styling
import { logAnalyticsEvent } from '../services/analyticsService'; // Import analytics logger
import { useToast } from '../context/ToastContext';
import { NewsBanner } from './NewsBanner';
import { getActiveBanners, getDismissedBannerIds, dismissBanner } from '../newsBanners';
import { ENABLE_ECLIPSE_THEME } from '../constants';
import eclipseLogo from '../src/assets/eclipse_logo.png';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // To toggle between Sign In and Sign Up for email/pass
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);
  const { addToast } = useToast();

  // Load dismissed banners on mount
  useEffect(() => {
    setDismissedBannerIds(getDismissedBannerIds());
  }, []);

  const handleBannerDismiss = useCallback((bannerId: string) => {
    dismissBanner(bannerId);
    setDismissedBannerIds(getDismissedBannerIds());
  }, []);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await authService.signUpWithEmail(email, password);
        logAnalyticsEvent('sign_up', { method: 'email' });
        addToast('Sign up successful! Please sign in.', { type: 'success', duration: 5000 });
        setIsSignUp(false); // Switch to sign-in mode
      } else {
        await authService.signInWithEmail(email, password);
        // App.tsx onAuthChange will handle redirect/UI update and log 'login' event
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
      console.error('Email/Pass Auth Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
      // App.tsx onAuthChange will handle redirect/UI update and log 'login' event
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      console.error('Google Sign In Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Vite exposes client-side configuration through import.meta.env. The old
  // process.env check made the login form appear disabled after the build
  // configuration was cleaned up.
  const firebaseConfigValid = Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  );

  // Get active banners for login screen
  const activeBanners = getActiveBanners(dismissedBannerIds).filter(
    (banner) => banner.showOnLoginScreen || banner.onlyOnLogin
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* News Banners */}
      <div className="w-full max-w-3xl mb-4">
        <AnimatePresence initial={false}>
          {activeBanners.map((banner) => (
            <NewsBanner key={banner.id} banner={banner} onDismiss={handleBannerDismiss} />
          ))}
        </AnimatePresence>
      </div>
      <div className="card p-8 sm:p-10 md:p-14 w-full max-w-md text-center">
        <div className="mb-6 text-center">
          {ENABLE_ECLIPSE_THEME ? (
            <img src={eclipseLogo} alt="Eclipse Patch Maker" className="h-32 w-auto mx-auto object-contain drop-shadow-[0_0_15px_rgba(255,51,0,0.8)]" />
          ) : (
            <i className="fas fa-dragon text-6xl text-[var(--clr-accent)]"></i>
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--clr-text)] tracking-wider mb-3">
          {ENABLE_ECLIPSE_THEME ? 'Eclipse Patch Maker' : 'Dokkan Patch Maker'}
        </h1>

        <p className="text-[var(--clr-text-muted)] text-md sm:text-lg mb-8">
          {isSignUp ? 'Create an account' : 'Sign in to continue'}
        </p>

        {!firebaseConfigValid && (
          <div className="my-4 p-3 bg-red-800 bg-opacity-80 border border-red-600 rounded-md text-yellow-300 text-sm">
            <p className="font-semibold">
              <i className="fas fa-exclamation-triangle mr-2"></i>Firebase Configuration Missing
            </p>
            <p className="text-xs mt-1">
              Firebase is not configured correctly. Please ensure your <code>.env.local</code> file
              contains valid <code>VITE_FIREBASE_API_KEY</code>,{' '}
              <code>VITE_FIREBASE_AUTH_DOMAIN</code>, etc. Authentication features will not work.
            </p>
          </div>
        )}

        <form onSubmit={handleEmailPasswordSubmit} className="space-y-5">
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
            disabled={isLoading || !firebaseConfigValid}
          />
          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            disabled={isLoading || !firebaseConfigValid}
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-900 bg-opacity-40 p-2 rounded-md">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password || !firebaseConfigValid}
            className="w-full btn-primary py-3 px-4 text-lg"
          >
            {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          disabled={isLoading || !firebaseConfigValid}
          className="mt-4 text-sm text-[var(--clr-secondary)] hover:text-[var(--clr-primary)] disabled:opacity-60 transition-colors"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>

        <div className="my-6 flex items-center">
          <hr className="flex-grow border-t border-[var(--clr-border)]" />
          <span className="px-3 text-[var(--clr-text-muted)] text-sm">OR</span>
          <hr className="flex-grow border-t border-[var(--clr-border)]" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading || !firebaseConfigValid}
          className="w-full btn-secondary text-lg py-3 px-4 rounded-md flex items-center justify-center"
        >
          {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
          <i className="fab fa-google mr-2"></i> Sign In with Google
        </button>
      </div>
      <br />
      <footer className="absolute bottom-0 text-center w-full text-xs text-[var(--clr-text-muted)] opacity-80">
        <p>
          &copy; {new Date().getFullYear()} Dokkan Patch Maker by @RapiddRobbiee. For personal and
          educational use only.
        </p>
        {import.meta.env.VITE_FIREBASE_PROJECT_ID && (
          <p className="text-xs opacity-50">Powered by Google Firebase & Gemini</p>
        )}
      </footer>
    </div>
  );
};

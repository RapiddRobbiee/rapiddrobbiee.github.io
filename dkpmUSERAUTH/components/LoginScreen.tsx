import React, { useState } from 'react';
import * as authService from '../services/authService';
import { FormInput } from './FormControls'; // Assuming FormInput handles general input styling

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // To toggle between Sign In and Sign Up for email/pass

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await authService.signUpWithEmail(email, password);
        alert('Sign up successful! Please sign in.');
        setIsSignUp(false); // Switch to sign-in mode
      } else {
        await authService.signInWithEmail(email, password);
        // App.tsx onAuthChange will handle redirect/UI update
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
      console.error("Email/Pass Auth Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
      // App.tsx onAuthChange will handle redirect/UI update
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      console.error("Google Sign In Error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const firebaseConfigValid = process.env.FIREBASE_API_KEY && process.env.FIREBASE_AUTH_DOMAIN;


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-indigo-900 text-indigo-100 font-rajdhani">
      <div className="bg-indigo-800 bg-opacity-70 p-8 sm:p-10 md:p-14 rounded-xl shadow-2xl w-full max-w-md text-center border-2 border-orange-500 border-opacity-50">
        <div className="mb-6 text-center">
            <i className="fas fa-dragon text-6xl text-orange-400 p-3 bg-orange-500 bg-opacity-20 rounded-full shadow-lg" 
               style={{ textShadow: '0 0 10px rgba(251, 146, 60, 0.7)'}}></i>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-orange-400 tracking-wider title-animated mb-3">
          Dokkan Battle Patch Maker
        </h1>
        <p className="text-indigo-200 text-md sm:text-lg mb-8">
          {isSignUp ? 'Create an account' : 'Sign in to continue'}
        </p>

        {!firebaseConfigValid && (
            <div className="my-4 p-3 bg-red-800 bg-opacity-80 border border-red-600 rounded-md text-yellow-300 text-sm">
                <p className="font-semibold"><i className="fas fa-exclamation-triangle mr-2"></i>Firebase Configuration Missing</p>
                <p className="text-xs mt-1">
                    Firebase is not configured correctly. Please ensure your <code>.env.local</code> file 
                    contains valid <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>, etc.
                    Authentication features will not work.
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
          
          {error && <p className="text-red-400 text-sm bg-red-900 bg-opacity-40 p-2 rounded-md">{error}</p>}

          <button 
            type="submit" 
            disabled={isLoading || !email || !password || !firebaseConfigValid}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out disabled:opacity-60 flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-rajdhani text-lg"
          >
            {isLoading && <i className="fas fa-spinner fa-spin mr-2"></i>}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button 
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          disabled={isLoading || !firebaseConfigValid}
          className="mt-4 text-sm text-orange-300 hover:text-orange-400 disabled:opacity-60"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>

        <div className="my-6 flex items-center">
          <hr className="flex-grow border-t border-indigo-600"/>
          <span className="px-3 text-indigo-400 text-sm">OR</span>
          <hr className="flex-grow border-t border-indigo-600"/>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={isLoading || !firebaseConfigValid}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out disabled:opacity-60 flex items-center justify-center shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 font-rajdhani text-lg"
        >
          {isLoading && isSignUp && <i className="fas fa-spinner fa-spin mr-2"></i>}
          <i className="fab fa-google mr-2"></i> Sign In with Google
        </button>
        
      </div>
      <footer className="absolute bottom-4 text-center w-full text-xs text-indigo-400 opacity-80">
        <p>&copy; {new Date().getFullYear()} Dokkan Patch Maker. For personal and educational use.</p>
         {process.env.FIREBASE_PROJECT_ID && <p className="text-xs opacity-50">Project: {process.env.FIREBASE_PROJECT_ID}</p>}
      </footer>
    </div>
  );
};

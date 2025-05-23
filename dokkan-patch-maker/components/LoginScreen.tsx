import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials, UserWithToken } from '../types'; // UserWithToken might not be directly used here anymore

interface LoginScreenProps {
  onLoginSuccess?: ( /* user: User */) => void; // UserWithToken might change to just User or void
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, authState } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  // Local error for form validation, authState.error for API errors
  const [formError, setFormError] = useState<string | null>(null); 
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in (e.g., due to localStorage token),
    // potentially redirect or inform user.
    // For now, if login is successful via form, this effect handles it.
    if (authState.currentUser) {
      setSuccessMessage(`Logged in as ${authState.currentUser.username}!`);
      if (onLoginSuccess) {
        onLoginSuccess(); // Or pass authState.currentUser
      }
      // Reset form fields after successful login and message display
      setUsernameOrEmail('');
      setPassword('');
    }
  }, [authState.currentUser, onLoginSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null); // Clear local form error
    setSuccessMessage(null);


    if (!usernameOrEmail || !password) {
      setFormError('Both username/email and password are required.');
      return;
    }

    const credentials: LoginCredentials = { usernameOrEmail, password };

    try {
      await login(credentials);
      // Success message and form clearing is now handled by useEffect
      // based on authState.currentUser changing.
    } catch (err: any) {
      // Error from authContext will be in authState.error
      // No need to set local error here if authState.error is used for display
      // If component-specific error handling beyond what context provides is needed, use setFormError
      console.error("Login attempt failed:", err); // Keep console log for debugging
    }
  };

  // Don't render the form if the user is already logged in and identified by the context
  if (authState.currentUser && !authState.isLoading && !authState.error) {
    return (
      <div>
        <h2>Login</h2>
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        <p>You are already logged in as {authState.currentUser.username}.</p>
      </div>
    );
  }


  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="usernameOrEmail">Username or Email:</label>
          <input
            type="text"
            id="usernameOrEmail"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            disabled={authState.isLoading}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={authState.isLoading}
          />
        </div>
        <button type="submit" disabled={authState.isLoading}>
          {authState.isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {formError && <p style={{ color: 'red' }}>{formError}</p>}
      {authState.error && <p style={{ color: 'red' }}>{authState.error}</p>}
      {successMessage && !authState.currentUser && <p style={{ color: 'green' }}>{successMessage}</p>}
    </div>
  );
};

export default LoginScreen;

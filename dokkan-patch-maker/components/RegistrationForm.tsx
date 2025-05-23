import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRegistrationData } from '../types';

const RegistrationForm: React.FC = () => {
  const { register, authState } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Local form error and success messages
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null); // Clear local form error
    setSuccessMessage(null);

    if (!username || !email || !password || !confirmPassword) {
      setFormError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const registrationData: UserRegistrationData = { username, email, password };

    try {
      await register(registrationData);
      setSuccessMessage('Registration successful! Please log in.');
      // Clear form fields
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      // Error from authContext will be in authState.error
      // For now, we also set local formError for immediate feedback if context doesn't update fast enough or for non-API errors
      setFormError(err.message || 'Registration failed. Please try again.');
      console.error("Registration attempt failed:", err);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={authState.isLoading}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={authState.isLoading}
          />
        </div>
        <button type="submit" disabled={authState.isLoading}>
          {authState.isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {formError && <p style={{ color: 'red' }}>{formError}</p>}
      {/* Display global error from AuthContext if it's relevant and not overridden by local formError */}
      {authState.error && !formError && <p style={{ color: 'red' }}>{authState.error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
    </div>
  );
};

export default RegistrationForm;

import React, { useState } from 'react';
import { validatePassword } from '../../utils/sessionManager';
import './PasswordGate.css';

const PasswordGate = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await validatePassword(password, rememberMe);
      
      if (result.success) {
        onAuthenticated();
      } else {
        setError(result.error || 'Invalid password. Please try again.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-gate-overlay">
      <div className="password-gate-card">
        <div className="password-gate-header">
          <h1 className="password-gate-title">🐻 Bobo's Chinese Writing App</h1>
          <p className="password-gate-subtitle">Welcome! Please enter the family password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="password-gate-form">
          <div className="password-gate-input-group">
            <label htmlFor="password" className="password-gate-label">
              🔒 Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="password-gate-input"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="password-gate-checkbox-group">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="password-gate-checkbox"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="password-gate-checkbox-label">
              Remember me for 7 days
            </label>
          </div>

          {error && (
            <div className="password-gate-error">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="password-gate-button"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? (
              <>
                <span className="password-gate-spinner">🔄</span>
                Checking...
              </>
            ) : (
              <>
                🚀 Let's Go!
              </>
            )}
          </button>
        </form>

        <div className="password-gate-footer">
          <p>Made with 💖 for family learning</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordGate;

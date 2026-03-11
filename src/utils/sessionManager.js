// src/utils/sessionManager.js
// Manages user session authentication state

const SESSION_TOKEN_KEY = 'bobo_session_token';
const SESSION_EXPIRES_KEY = 'bobo_session_expires';

/**
 * Validates password with the server and stores session
 * @param {string} password - The family password
 * @param {boolean} rememberMe - Whether to remember for 7 days
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function validatePassword(password, rememberMe = true) {
  try {
    const response = await fetch('/api/validate-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, rememberMe }),
    });

    const data = await response.json();

    if (data.success) {
      // Store session in localStorage
      localStorage.setItem(SESSION_TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_EXPIRES_KEY, data.expiresAt);
      return { success: true };
    } else {
      return { 
        success: false, 
        error: data.error || 'Invalid password' 
      };
    }
  } catch (error) {
    console.error('Error validating password:', error);
    return { 
      success: false, 
      error: 'Network error. Please try again.' 
    };
  }
}

/**
 * Checks if the user has a valid session
 * @returns {boolean}
 */
export function hasValidSession() {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  const expiresAt = localStorage.getItem(SESSION_EXPIRES_KEY);

  if (!token || !expiresAt) {
    return false;
  }

  // Check if session has expired
  const expirationDate = new Date(expiresAt);
  const now = new Date();

  if (now > expirationDate) {
    // Clear expired session
    clearSession();
    return false;
  }

  return true;
}

/**
 * Gets the current session token for API requests
 * @returns {string|null}
 */
export function getSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Clears the current session
 */
export function clearSession() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_EXPIRES_KEY);
}

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(endpoint, options = {}) {
  const token = getSessionToken();
  
  if (!token) {
    throw new Error('No valid session');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If unauthorized, clear session
  if (response.status === 401) {
    clearSession();
  }

  return response;
}

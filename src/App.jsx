import React, { useState, useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { CharacterGrid } from './components/Canvas/CharacterGrid';
import PasswordGate from './components/Auth/PasswordGate';
import { hasValidSession } from './utils/sessionManager';
import { DebugLog } from './components/DebugLog';
import './styles/global.css';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has a valid session on mount
    const checkSession = () => {
      const hasSession = hasValidSession();
      setIsAuthenticated(hasSession);
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner">🐻</div>
        <p>Loading Bobo's App...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {!isAuthenticated ? (
        <PasswordGate onAuthenticated={handleAuthenticated} />
      ) : (
        <>
          <Header />
          <main className="main-content">
            <CharacterGrid />
          </main>
          <Footer />
          <DebugLog />
        </>
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import './DebugLog.css';

// Global event log that can be accessed from anywhere
let globalEventLog = [];
let listeners = [];

export function logPointerEvent(eventType, details = {}) {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3 
  });
  
  const entry = {
    id: Date.now() + Math.random(),
    timestamp,
    eventType,
    details: JSON.stringify(details).slice(0, 100),
  };
  
  globalEventLog.unshift(entry);
  if (globalEventLog.length > 20) {
    globalEventLog = globalEventLog.slice(0, 20);
  }
  
  // Notify all listeners
  listeners.forEach(listener => listener([...globalEventLog]));
}

export function getEventLog() {
  return [...globalEventLog];
}

export function clearEventLog() {
  globalEventLog = [];
  listeners.forEach(listener => listener([]));
}

export function DebugLog() {
  const [events, setEvents] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Register as listener
    listeners.push(setEvents);
    setEvents([...globalEventLog]);
    
    return () => {
      listeners = listeners.filter(l => l !== setEvents);
    };
  }, []);
  
  if (!isVisible) {
    return (
      <button className="debug-toggle" onClick={() => setIsVisible(true)}>
        📋 Show Debug Log
      </button>
    );
  }
  
  return (
    <div className="debug-log-container">
      <div className="debug-log-header">
        <h4>📋 Pointer Event Log</h4>
        <div className="debug-log-actions">
          <button onClick={clearEventLog} className="debug-clear">Clear</button>
          <button onClick={() => setIsVisible(false)} className="debug-hide">Hide</button>
        </div>
      </div>
      <div className="debug-log-content">
        {events.length === 0 ? (
          <div className="debug-empty">No events yet...</div>
        ) : (
          events.map(event => (
            <div key={event.id} className={`debug-entry ${event.eventType.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="debug-time">{event.timestamp}</span>
              <span className="debug-type">{event.eventType}</span>
              <span className="debug-details">{event.details}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
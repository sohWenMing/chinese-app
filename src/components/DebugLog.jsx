import { useState, useEffect, useMemo } from 'react';
import './DebugLog.css';

// Global event log that can be accessed from anywhere
let globalEventLog = [];
let listeners = [];

// Helper function to get pointer type from event
function getPointerType(event) {
  if (!event) return 'unknown';
  if (event.pointerType) return event.pointerType;
  if (event.type && event.type.includes('touch')) return 'touch';
  if (event.type && event.type.includes('mouse')) return 'mouse';
  return 'unknown';
}

// Helper function to format pressure value
function formatPressure(pressure) {
  if (pressure === undefined || pressure === null) return null;
  if (pressure === 0.5) return 'default';
  return Math.round(pressure * 100) + '%';
}

// Helper function to determine stroke phase from event type
function getStrokePhase(eventType) {
  if (eventType.includes('down') || eventType.includes('start')) return 'start';
  if (eventType.includes('move')) return 'move';
  if (eventType.includes('up') || eventType.includes('end')) return 'end';
  if (eventType.includes('cancel')) return 'cancel';
  return 'unknown';
}

// Create a structured stroke entry from pointer event
export function createStrokeEntry(event, eventType, additionalDetails = {}) {
  const timestamp = new Date().toISOString();
  const displayTimestamp = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });

  const entry = {
    id: Date.now() + Math.random(),
    timestamp: displayTimestamp,
    isoTimestamp: timestamp,
    eventType,
    pointerType: getPointerType(event),
    pressure: event?.pressure !== undefined ? event.pressure : null,
    pressureFormatted: formatPressure(event?.pressure),
    coordinates: event ? { x: Math.round(event.clientX), y: Math.round(event.clientY) } : null,
    phase: getStrokePhase(eventType),
    success: additionalDetails.success !== undefined ? additionalDetails.success : null,
    details: JSON.stringify(additionalDetails).slice(0, 100),
    rawEvent: event ? {
      button: event.button,
      buttons: event.buttons,
      isPrimary: event.isPrimary,
      pointerId: event.pointerId
    } : null
  };

  return entry;
}

// Enhanced logging function with stroke metadata
export function logPointerEvent(eventType, details = {}, pointerEvent = null) {
  // If first arg is an event object, treat it as a pointer event
  if (eventType && typeof eventType === 'object' && eventType.type) {
    pointerEvent = eventType;
    eventType = pointerEvent.type;
  }

  let entry;

  if (pointerEvent) {
    // Create rich stroke entry
    entry = createStrokeEntry(pointerEvent, eventType, details);
  } else {
    // Legacy format for backward compatibility
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    entry = {
      id: Date.now() + Math.random(),
      timestamp,
      isoTimestamp: new Date().toISOString(),
      eventType,
      pointerType: 'unknown',
      pressure: null,
      pressureFormatted: null,
      coordinates: null,
      phase: getStrokePhase(eventType),
      success: null,
      details: JSON.stringify(details).slice(0, 100),
      rawEvent: null
    };
  }

  globalEventLog.unshift(entry);
  if (globalEventLog.length > 20) {
    globalEventLog = globalEventLog.slice(0, 20);
  }

  // Notify all listeners
  listeners.forEach(listener => listener([...globalEventLog]));
}

// Specialized function for logging stroke events with full metadata
export function logStrokeEvent(event, phase, details = {}) {
  if (!event) {
    console.warn('logStrokeEvent called without event object');
    return;
  }

  const eventType = phase === 'start' ? 'drawing-start' :
                   phase === 'move' ? 'drawing-move' :
                   phase === 'end' ? 'drawing-end' :
                   phase === 'cancel' ? 'drawing-cancel' : event.type;

  logPointerEvent(eventType, details, event);
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
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [autoClearEnabled, setAutoClearEnabled] = useState(false);
  const [clearFeedback, setClearFeedback] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  
  useEffect(() => {
    // Register as listener
    listeners.push(setEvents);
    setEvents([...globalEventLog]);
    
    return () => {
      listeners = listeners.filter(l => l !== setEvents);
    };
  }, []);
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    if (events.length === 0) return null;

    const totalEvents = events.length;
    const successfulStrokes = events.filter(e => e.success === true).length;
    const failedStrokes = events.filter(e => e.success === false).length;
    
    // Pointer type breakdown
    const pointerTypes = events.reduce((acc, e) => {
      const type = e.pointerType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Average pressure
    const eventsWithPressure = events.filter(e => e.pressure !== null && e.pressure !== undefined);
    const avgPressure = eventsWithPressure.length > 0
      ? eventsWithPressure.reduce((sum, e) => sum + e.pressure, 0) / eventsWithPressure.length
      : null;

    // Session duration
    const timestamps = events
      .map(e => e.isoTimestamp ? new Date(e.isoTimestamp).getTime() : null)
      .filter(t => t !== null);
    const sessionDuration = timestamps.length > 1
      ? Math.max(...timestamps) - Math.min(...timestamps)
      : 0;

    return {
      totalEvents,
      successfulStrokes,
      failedStrokes,
      pointerTypes,
      avgPressure,
      sessionDuration
    };
  }, [events]);

  // Generate formatted logs with summary
  const generateFormattedLogs = () => {
    let output = '';
    
    if (summary) {
      output += '=== DEBUG LOG SUMMARY ===\n';
      output += `Total Events: ${summary.totalEvents}\n`;
      output += `Successful Strokes: ${summary.successfulStrokes}\n`;
      output += `Failed Strokes: ${summary.failedStrokes}\n`;
      output += `Pointer Types: ${Object.entries(summary.pointerTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ')}\n`;
      if (summary.avgPressure !== null) {
        output += `Average Pressure: ${Math.round(summary.avgPressure * 100)}%\n`;
      }
      if (summary.sessionDuration > 0) {
        const seconds = Math.round(summary.sessionDuration / 1000);
        output += `Session Duration: ${seconds}s\n`;
      }
      output += '========================\n\n';
    }
    
    output += events.map(event => 
      `[${event.timestamp}] ${event.eventType}: ${event.details}`
    ).join('\n');
    
    return output || 'No events logged';
  };

  const copyToClipboard = () => {
    const formattedLogs = generateFormattedLogs();
    
    navigator.clipboard.writeText(formattedLogs).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
      
      if (autoClearEnabled) {
        clearEventLog();
        setClearFeedback(true);
        setTimeout(() => setClearFeedback(false), 2000);
      }
    });
  };

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  const saveToFile = async () => {
    const formattedLogs = generateFormattedLogs();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `debug-log-${timestamp}.txt`;
    
    setSaveError(null);
    
    try {
      // Try using File System Access API for better iOS support
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Text Files',
              accept: { 'text/plain': ['.txt'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(formattedLogs);
          await writable.close();
          
          // Success - auto-clear if enabled
          if (autoClearEnabled) {
            clearEventLog();
            setClearFeedback(true);
            setTimeout(() => setClearFeedback(false), 2000);
          }
          return;
        } catch (err) {
          // User cancelled or permission denied - don't treat as error
          if (err.name === 'AbortError') {
            return;
          }
          // Fall through to fallback method
          console.log('File System Access API failed, using fallback:', err.message);
        }
      }
      
      // Fallback: Use traditional download method
      const blob = new Blob([formattedLogs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // For iOS, open in new tab as fallback
      if (isIOS()) {
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.document.title = fileName;
        } else {
          setSaveError('Please allow popups to save files on iOS');
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      URL.revokeObjectURL(url);
      
      // Success - auto-clear if enabled
      if (autoClearEnabled) {
        clearEventLog();
        setClearFeedback(true);
        setTimeout(() => setClearFeedback(false), 2000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(`Save failed: ${err.message || 'Unknown error'}`);
      setTimeout(() => setSaveError(null), 5000);
    }
  };

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
          <label className="debug-autoclear-label">
            <input
              type="checkbox"
              checked={autoClearEnabled}
              onChange={(e) => setAutoClearEnabled(e.target.checked)}
              className="debug-autoclear-checkbox"
            />
            Auto-clear
          </label>
          {clearFeedback && <span className="debug-clear-feedback">✓ Cleared!</span>}
          {saveError && <span className="debug-error-feedback">⚠ {saveError}</span>}
          <button onClick={copyToClipboard} className="debug-copy" style={{ minWidth: copyFeedback ? '70px' : 'auto' }}>
            {copyFeedback ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button onClick={saveToFile} className="debug-save">💾 Save</button>
          <button onClick={clearEventLog} className="debug-clear">Clear</button>
          <button onClick={() => setIsVisible(false)} className="debug-hide">Hide</button>
        </div>
      </div>
      {summary && (
        <div className="debug-summary">
          <button 
            className="debug-summary-toggle" 
            onClick={() => setSummaryExpanded(!summaryExpanded)}
          >
            {summaryExpanded ? '▼' : '▶'} Summary ({summary.totalEvents} events)
          </button>
          {summaryExpanded && (
            <div className="debug-summary-content">
              <div className="debug-summary-row">
                <span className="debug-summary-label">✓ Successful:</span>
                <span className="debug-summary-value success">{summary.successfulStrokes}</span>
              </div>
              <div className="debug-summary-row">
                <span className="debug-summary-label">✗ Failed:</span>
                <span className="debug-summary-value failure">{summary.failedStrokes}</span>
              </div>
              {Object.entries(summary.pointerTypes).length > 0 && (
                <div className="debug-summary-row">
                  <span className="debug-summary-label">Input Types:</span>
                  <span className="debug-summary-value">
                    {Object.entries(summary.pointerTypes).map(([type, count]) => (
                      <span key={type} className="debug-summary-badge">
                        {type === 'mouse' ? '🖱️' : type === 'touch' ? '👆' : type === 'pen' ? '✏️' : '❓'} {count}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {summary.avgPressure !== null && (
                <div className="debug-summary-row">
                  <span className="debug-summary-label">Avg Pressure:</span>
                  <span className="debug-summary-value">{Math.round(summary.avgPressure * 100)}%</span>
                </div>
              )}
              {summary.sessionDuration > 0 && (
                <div className="debug-summary-row">
                  <span className="debug-summary-label">Duration:</span>
                  <span className="debug-summary-value">{Math.round(summary.sessionDuration / 1000)}s</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="debug-log-content">
        {events.length === 0 ? (
          <div className="debug-empty">No events yet...</div>
        ) : (
          events.map(event => (
            <div key={event.id} className={`debug-entry ${event.eventType.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="debug-time">{event.timestamp}</span>
              <span className="debug-type">{event.eventType}</span>
              <span className="debug-meta">
                {event.pointerType && event.pointerType !== 'unknown' && (
                  <span className="debug-pointer-type" title={`Pointer: ${event.pointerType}`}>
                    {event.pointerType === 'mouse' ? '🖱️' :
                     event.pointerType === 'touch' ? '👆' :
                     event.pointerType === 'pen' ? '✏️' : '❓'}
                  </span>
                )}
                {event.pressureFormatted && (
                  <span className="debug-pressure" title={`Pressure: ${event.pressureFormatted}`}>
                    💪{event.pressureFormatted}
                  </span>
                )}
                {event.coordinates && (
                  <span className="debug-coords" title={`X: ${event.coordinates.x}, Y: ${event.coordinates.y}`}>
                    📍{event.coordinates.x},{event.coordinates.y}
                  </span>
                )}
                {event.success !== null && (
                  <span className={`debug-success ${event.success ? 'success' : 'failure'}`}>
                    {event.success ? '✓' : '✗'}
                  </span>
                )}
              </span>
              <span className="debug-details">{event.details}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
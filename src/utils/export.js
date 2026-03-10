/**
 * Utility functions for exporting stroke data
 */

/**
 * Export stroke data as a JSON file download
 * @param {Object} data - The stroke data object to export
 */
export function exportStrokeData(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `chinese_writing_${timestamp}.json`;
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append, click, and remove link to trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
  
  console.log('Exported stroke data:', data);
  console.log('Saved as:', filename);
}

/**
 * Create a stroke data structure for a single character
 * @param {number} charIndex - Index of the character
 * @param {Array} strokes - Array of stroke objects
 * @returns {Object} Character data object
 */
export function createCharacterData(charIndex, strokes = []) {
  return {
    charIndex,
    strokeCount: strokes.length,
    strokes: strokes.map(stroke => ({
      points: stroke.points.map(p => ({
        x: p.x,
        y: p.y,
        pressure: p.pressure,
        timestamp: p.timestamp,
      })),
      startTime: stroke.startTime,
      endTime: stroke.endTime,
    })),
  };
}

/**
 * Create a complete session data structure
 * @param {string} sessionId - Unique session identifier
 * @param {Array} characters - Array of character data objects
 * @returns {Object} Session data object
 */
export function createSessionData(sessionId, characters = []) {
  const timestamp = Date.now();
  
  return {
    sessionId: sessionId || `session_${timestamp}`,
    timestamp,
    totalCells: characters.length,
    characters: characters.filter(char => char.strokes && char.strokes.length > 0),
  };
}

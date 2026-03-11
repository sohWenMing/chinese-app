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

/**
 * Export comprehensive writing session data for LLM integration
 * Creates a single JSON with phrase, character metadata, and stroke data
 * 
 * @param {string} sessionId - Unique session identifier
 * @param {Array} confirmedCharacters - Array of confirmed character objects with timestamps
 * @param {Array} characterData - Array of raw character data with strokes
 */
export function exportComprehensiveSession(sessionId, confirmedCharacters, characterData) {
  // Filter only confirmed characters (non-null)
  const confirmed = confirmedCharacters
    .map((char, index) => ({ ...char, gridIndex: index }))
    .filter(char => char && char.character);
  
  if (confirmed.length === 0) {
    console.log('No confirmed characters to export');
    return;
  }
  
  // Sort by confirmation time (when the child confirmed the character)
  const sortedCharacters = confirmed.sort((a, b) => (a.confirmedAt || 0) - (b.confirmedAt || 0));
  
  // Build the phrase string
  const phrase = sortedCharacters.map(char => char.character).join('');
  
  // Build comprehensive character data with strokes
  const charactersWithMetadata = sortedCharacters.map((char, sequenceIndex) => {
    // Find matching stroke data from characterData
    const strokeData = characterData[char.gridIndex] || { strokes: [] };
    
    return {
      sequence: sequenceIndex + 1,
      character: char.character,
      pinyin: char.pinyin || '',
      confidence: char.confidence || 0,
      confirmedAt: char.confirmedAt,
      gridIndex: char.gridIndex,
      strokeCount: strokeData.strokes ? strokeData.strokes.length : 0,
      strokes: strokeData.strokes ? strokeData.strokes.map(stroke => ({
        points: stroke.points.map(p => ({
          x: p.x,
          y: p.y,
          pressure: p.pressure,
          timestamp: p.timestamp,
        })),
        startTime: stroke.startTime,
        endTime: stroke.endTime,
      })) : [],
    };
  });
  
  const exportData = {
    sessionId: sessionId || `session_${Date.now()}`,
    exportedAt: Date.now(),
    phrase: phrase,
    characterCount: sortedCharacters.length,
    characters: charactersWithMetadata,
  };
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `chinese_writing_${timestamp}.json`;
  
  // Create and trigger download
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  console.log('Exported comprehensive session data:', exportData);
  console.log('Saved as:', filename);
}

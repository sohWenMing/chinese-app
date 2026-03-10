/**
 * Hanzi Recognition Utility using HanziLookupJS
 * 
 * Real handwriting recognition that analyzes stroke patterns,
 * directions, and shapes - not just stroke count.
 */

import { toPinyin } from './pinyin.js';

// HanziLookupJS initialization state
let isInitialized = false;
let initPromise = null;
let mmahMatcher = null;

/**
 * Initialize HanziLookupJS with the character database
 * This loads the character data files asynchronously
 * 
 * @returns {Promise<boolean>} - True if initialization successful
 */
export function initHanziLookup() {
  if (isInitialized) {
    return Promise.resolve(true);
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = new Promise((resolve) => {
    // Check if HanziLookup is loaded
    if (typeof window.HanziLookup === 'undefined') {
      console.error('HanziLookupJS library not loaded');
      resolve(false);
      return;
    }
    
    // Initialize MMAH data (Make Me a Hanzi - has location data, better accuracy)
    window.HanziLookup.init("mmah", "/hanzilookup/mmah.json", (success) => {
      if (success) {
        mmahMatcher = new window.HanziLookup.Matcher("mmah");
        isInitialized = true;
        console.log('HanziLookupJS initialized successfully');
        resolve(true);
      } else {
        console.error('Failed to load HanziLookupJS data');
        resolve(false);
      }
    });
  });
  
  return initPromise;
}

/**
 * Convert stroke data from our format to HanziLookupJS format
 * Normalizes coordinates to 0-255 range expected by HanziLookupJS
 * 
 * Our format: [{ points: [{x, y, pressure, timestamp}], startTime, endTime }]
 * HanziLookup format: [[ [x, y], [x, y], ... ], [ [x, y], ... ]]
 * 
 * @param {Array} strokes - Our stroke format
 * @returns {Array} - HanziLookupJS stroke format with normalized coordinates
 */
function convertStrokesToHanziFormat(strokes) {
  if (!strokes || strokes.length === 0) return [];
  
  // Filter out strokes with fewer than 2 points (need at least a line)
  const validStrokes = strokes.filter(stroke => stroke.points && stroke.points.length >= 2);
  
  if (validStrokes.length === 0) return [];
  
  // Find the bounding box of all strokes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  validStrokes.forEach(stroke => {
    stroke.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });
  
  // Calculate scale to fit in 255x255 box (HanziLookupJS standard)
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const maxDimension = Math.max(width, height);
  const scale = 255 / maxDimension;
  
  // Center the character in the 255x255 box
  const offsetX = (255 - width * scale) / 2 - minX * scale;
  const offsetY = (255 - height * scale) / 2 - minY * scale;
  
  return validStrokes.map(stroke => {
    return stroke.points.map(point => [
      Math.round(point.x * scale + offsetX),
      Math.round(point.y * scale + offsetY)
    ]);
  });
}

/**
 * Recognize a Chinese character from stroke data using HanziLookupJS
 * This analyzes actual stroke patterns, not just count
 * 
 * @param {Array} strokes - Array of stroke objects with points
 * @param {number} maxCandidates - Maximum number of candidates to return (default 8)
 * @returns {Promise<Array>} - Array of { character, pinyin, confidence } objects
 */
export async function recognizeCharacter(strokes, maxCandidates = 8) {
  if (!strokes || strokes.length === 0) {
    return [];
  }
  
  // Ensure HanziLookup is initialized
  const initialized = await initHanziLookup();
  if (!initialized || !mmahMatcher) {
    console.warn('HanziLookup not initialized, falling back to stroke count matching');
    return fallbackRecognition(strokes);
  }
  
  try {
    // Convert strokes to HanziLookup format
    const hanziStrokes = convertStrokesToHanziFormat(strokes);
    
    // Check if we have valid strokes after conversion
    if (!hanziStrokes || hanziStrokes.length === 0) {
      return fallbackRecognition(strokes);
    }
    
    // Create analyzed character
    const analyzedChar = new window.HanziLookup.AnalyzedCharacter(hanziStrokes);
    
    // Perform matching
    const matches = await new Promise((resolve) => {
      mmahMatcher.match(analyzedChar, maxCandidates, (results) => {
        resolve(results);
      });
    });
    
    // Convert matches to our format with pinyin
    const results = await Promise.all(
      matches.slice(0, 5).map(async (match) => {
        const pinyin = toPinyin(match.character);
        return {
          character: match.character,
          pinyin: pinyin || '',
          confidence: Math.round(match.score * 100), // Convert score to percentage
        };
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error in HanziLookup recognition:', error);
    return fallbackRecognition(strokes);
  }
}

/**
 * Fallback recognition using stroke count
 * Used when HanziLookupJS fails or is not available
 * 
 * @param {Array} strokes - Array of stroke objects
 * @returns {Promise<Array>} - Array of character matches
 */
async function fallbackRecognition(strokes) {
  const strokeCount = strokes.length;
  
  // Simplified list of most common characters by stroke count
  const COMMON_CHARACTERS = {
    1: ['一', '乙'],
    2: ['二', '人', '十', '入', '八'],
    3: ['口', '大', '小', '三', '日', '月', '上', '下'],
    4: ['中', '天', '不', '见', '手', '文', '心'],
    5: ['本', '正', '用', '生', '白', '田', '目'],
    6: ['在', '有', '自', '年', '回', '同', '好'],
    7: ['你', '我', '他', '来', '说', '学', '时', '走'],
    8: ['国', '和', '到', '话', '面', '要', '看', '果'],
    9: ['是', '前', '很', '点', '思', '音', '香'],
    10: ['高', '家', '真', '起', '都', '流', '海'],
    11: ['得', '着', '教', '黄', '唱', '商', '第'],
    12: ['喜', '道', '最', '就', '画', '给', '黑'],
    13: ['新', '想', '路', '跳', '睡', '错', '歌'],
    14: ['算', '管'],
    15: ['影', '德'],
  };
  
  const candidates = COMMON_CHARACTERS[strokeCount] || [];
  const results = await Promise.all(
    candidates.slice(0, 5).map(async (char, i) => {
      const pinyin = toPinyin(char);
      return {
        character: char,
        pinyin: pinyin || '',
        confidence: 100 - (i * 10), // Descending confidence
      };
    })
  );
  
  return results;
}

/**
 * Get pinyin for a Chinese character
 * 
 * @param {string} character - Chinese character
 * @returns {Promise<string>} - Pinyin string
 */
export async function getCharacterPinyin(character) {
  if (!character) return '';
  
  try {
    const pinyin = toPinyin(character);
    return pinyin || '';
  } catch (error) {
    console.error('Error getting pinyin:', error);
    return '';
  }
}

/**
 * Capture the canvas as an image data URL
 * 
 * @param {HTMLElement} canvasElement - The SVG canvas element
 * @returns {string} - Data URL of the image
 */
export function captureCanvasImage(canvasElement) {
  if (!canvasElement) return null;
  
  try {
    // For SVG elements, we can serialize and convert
    const svgData = new XMLSerializer().serializeToString(canvasElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return url;
  } catch (error) {
    console.error('Error capturing canvas:', error);
    return null;
  }
}

/**
 * Export characters as text file
 * 
 * @param {Array} characters - Array of confirmed character objects
 */
export function exportCharactersAsText(characters) {
  if (!characters || characters.length === 0) return;
  
  // Filter out empty entries and get just the characters
  const charStrings = characters
    .filter(char => char && char.character)
    .map(char => char.character);
  
  // Join with spaces
  const text = charStrings.join(' ');
  
  // Create and download file
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `chinese_characters_${timestamp}.txt`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  console.log('Exported characters:', text);
  console.log('Saved as:', filename);
}

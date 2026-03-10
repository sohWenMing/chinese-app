import { useState, useCallback, useEffect } from 'react';
import { CharacterCell } from './CharacterCell';
import { exportStrokeData } from '../../utils/export';
import { recognizeCharacter, exportCharactersAsText, captureCanvasImage, initHanziLookup } from '../../utils/hanziRecognition';
import './CharacterGrid.css';

const CELL_COUNT = 4;

export function CharacterGrid() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [characterData, setCharacterData] = useState(
    Array(CELL_COUNT).fill(null).map((_, index) => ({
      charIndex: index,
      strokes: [],
    }))
  );
  const [confirmedCharacters, setConfirmedCharacters] = useState(
    Array(CELL_COUNT).fill(null)
  );
  const [pickerState, setPickerState] = useState({
    isOpen: false,
    cellIndex: null,
    candidates: [],
  });
  const [sessionStartTime] = useState(Date.now());
  const [hanziLookupReady, setHanziLookupReady] = useState(false);

  // Initialize HanziLookupJS on component mount
  useEffect(() => {
    initHanziLookup().then(success => {
      setHanziLookupReady(success);
    });
  }, []);

  const handleStrokeComplete = useCallback((cellIndex, newStroke) => {
    // Update character data by adding the new stroke
    setCharacterData(prev => {
      const updated = [...prev];
      updated[cellIndex] = {
        ...updated[cellIndex],
        strokes: [...updated[cellIndex].strokes, newStroke],
      };
      return updated;
    });
  }, []);

  const handleClear = useCallback((cellIndex) => {
    setCharacterData(prev => {
      const updated = [...prev];
      updated[cellIndex] = {
        ...updated[cellIndex],
        strokes: [],
      };
      return updated;
    });
    // Also clear confirmed character
    setConfirmedCharacters(prev => {
      const updated = [...prev];
      updated[cellIndex] = null;
      return updated;
    });
    // Close picker if open for this cell
    if (pickerState.cellIndex === cellIndex) {
      setPickerState({ isOpen: false, cellIndex: null, candidates: [] });
    }
  }, [pickerState.cellIndex]);

  const handleConfirm = useCallback(async (cellIndex, canvasElement) => {
    const strokes = characterData[cellIndex]?.strokes || [];
    if (strokes.length === 0) return;

    // Recognize character
    const candidates = await recognizeCharacter(strokes);
    
    setPickerState({
      isOpen: true,
      cellIndex,
      candidates,
    });
  }, [characterData]);

  const handlePickerSelect = useCallback((cellIndex, character, pinyin) => {
    // Capture canvas image
    const canvasSvg = document.querySelector(`.grid-cell-wrapper:nth-child(${cellIndex + 1}) svg`);
    const imageData = captureCanvasImage(canvasSvg);
    
    setConfirmedCharacters(prev => {
      const updated = [...prev];
      updated[cellIndex] = {
        character,
        pinyin,
        imageData,
      };
      return updated;
    });
    
    setPickerState({ isOpen: false, cellIndex: null, candidates: [] });
  }, []);

  const handleCancelPicker = useCallback(() => {
    setPickerState({ isOpen: false, cellIndex: null, candidates: [] });
  }, []);

  const handleCancelConfirm = useCallback((cellIndex) => {
    setConfirmedCharacters(prev => {
      const updated = [...prev];
      updated[cellIndex] = null;
      return updated;
    });
  }, []);

  const handleNavigate = useCallback((direction) => {
    if (direction === 'next') {
      setActiveIndex(prev => Math.min(prev + 1, CELL_COUNT - 1));
    } else if (direction === 'prev') {
      setActiveIndex(prev => Math.max(prev - 1, 0));
    }
  }, []);

  const handleCellClick = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  const handleExport = useCallback(() => {
    // Export stroke data as JSON
    const data = {
      sessionId: `session_${sessionStartTime}`,
      timestamp: sessionStartTime,
      totalCells: CELL_COUNT,
      characters: characterData.filter(char => char.strokes.length > 0).map(char => ({
        charIndex: char.charIndex,
        strokeCount: char.strokes.length,
        strokes: char.strokes,
      })),
    };
    
    exportStrokeData(data);
    
    // Export confirmed characters as text
    exportCharactersAsText(confirmedCharacters);
  }, [characterData, confirmedCharacters, sessionStartTime]);

  const hasAnyStrokes = characterData.some(char => char.strokes.length > 0);
  const hasAnyConfirmed = confirmedCharacters.some(char => char !== null);

  return (
    <div className="character-grid-container">
      <div className="grid-instructions">
        <h2>Write Your Chinese Characters!</h2>
        <p>Click a box to start writing. Use the arrow to move to the next box when you're done!</p>
      </div>
      
      <div className="character-grid">
        {characterData.map((charData, index) => (
          <div 
            key={index} 
            className={`grid-cell-wrapper ${activeIndex === index ? 'active-wrapper' : ''}`}
            onClick={() => handleCellClick(index)}
          >
            <CharacterCell
              index={index}
              isActive={activeIndex === index}
              strokes={charData.strokes}
              confirmed={confirmedCharacters[index]}
              onStrokeComplete={handleStrokeComplete}
              onClear={handleClear}
              onConfirm={handleConfirm}
              onCancelConfirm={handleCancelConfirm}
              onActivate={handleCellClick}
            />
          </div>
        ))}
      </div>
      
      {/* Character Picker Modal */}
      {pickerState.isOpen && (
        <div className="picker-modal-overlay" onClick={handleCancelPicker}>
          <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="picker-modal-header">
              <h3>Pick your character!</h3>
              <button 
                className="picker-modal-close"
                onClick={handleCancelPicker}
                aria-label="Close picker"
              >
                ✕
              </button>
            </div>
            <div className="picker-modal-content">
              {pickerState.candidates.length > 0 ? (
                <div className="picker-candidates">
                  {pickerState.candidates.map((candidate, i) => (
                    <button
                      key={i}
                      className="picker-candidate"
                      onClick={() => handlePickerSelect(pickerState.cellIndex, candidate.character, candidate.pinyin)}
                    >
                      <span className="candidate-char">{candidate.character}</span>
                      <span className="candidate-pinyin">{candidate.pinyin}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="picker-empty">
                  No matches found. Try writing more clearly!
                </div>
              )}
            </div>
            <div className="picker-modal-footer">
              Click the character that matches what you wrote
            </div>
          </div>
        </div>
      )}
      
      <div className="grid-navigation">
        <button 
          className="nav-button prev"
          onClick={() => handleNavigate('prev')}
          disabled={activeIndex === 0}
          aria-label="Previous character"
        >
          ←
        </button>
        
        <div className="cell-indicators">
          {characterData.map((_, index) => (
            <button
              key={index}
              className={`cell-dot ${activeIndex === index ? 'active' : ''} ${characterData[index].strokes.length > 0 ? 'completed' : ''}`}
              onClick={() => handleCellClick(index)}
              aria-label={`Go to cell ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          className="nav-button next"
          onClick={() => handleNavigate('next')}
          disabled={activeIndex === CELL_COUNT - 1}
          aria-label="Next character"
        >
          →
        </button>
      </div>
      
      <div className="grid-actions">
        <button 
          className="export-button"
          onClick={handleExport}
          disabled={!hasAnyStrokes}
        >
          📥 Export Your Writing
        </button>
        <p className="export-hint">
          {hasAnyConfirmed 
            ? `${confirmedCharacters.filter(c => c).length} characters confirmed!` 
            : hasAnyStrokes 
              ? `Click ✓ to confirm characters`
              : 'Start writing to enable export'}
        </p>
      </div>
    </div>
  );
}

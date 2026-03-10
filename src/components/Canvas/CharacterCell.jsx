import { useRef, useState, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import './CharacterCell.css';

export function CharacterCell({ 
  index, 
  isActive,
  strokes,
  confirmed,
  onStrokeComplete, 
  onClear,
  onConfirm,
  onCancelConfirm,
}) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => e.preventDefault();
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!isActive) return;
    e.preventDefault();
    setIsDrawing(true);
    const point = getPoint(e);
    setPoints([point]);
  }, [isActive]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !isActive) return;
    e.preventDefault();
    const point = getPoint(e);
    setPoints((prev) => [...prev, point]);
  }, [isDrawing, isActive]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || points.length === 0) return;
    
    const newStroke = {
      points: points.map(p => ({ 
        x: p.x, 
        y: p.y, 
        pressure: p.pressure, 
        timestamp: p.timestamp 
      })),
      startTime: points[0].timestamp,
      endTime: Date.now(),
    };
    
    // Notify parent about the new stroke
    if (onStrokeComplete) {
      onStrokeComplete(index, newStroke);
    }
    
    setPoints([]);
    setIsDrawing(false);
  }, [isDrawing, points, index, onStrokeComplete]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    // If there's a confirmed character, cancel confirmation first
    if (confirmed && onCancelConfirm) {
      onCancelConfirm(index);
    }
    if (onClear) {
      onClear(index);
    }
  }, [index, onClear, onCancelConfirm, confirmed]);

  const handleConfirm = useCallback((e) => {
    e.stopPropagation();
    if (onConfirm && strokes.length > 0) {
      onConfirm(index, canvasRef.current);
    }
  }, [index, strokes.length, onConfirm]);

  const handleCancelConfirm = useCallback((e) => {
    e.stopPropagation();
    if (onCancelConfirm) {
      onCancelConfirm(index);
    }
  }, [index, onCancelConfirm]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
      timestamp: Date.now(),
    };
  };

  const getSvgPathFromStroke = (strokePoints) => {
    const stroke = getStroke(strokePoints, {
      size: 16,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });
    
    if (stroke.length === 0) return '';
    
    const d = stroke.reduce(
      (acc, [x, y], i, arr) => {
        if (i === 0) return `M ${x} ${y}`;
        return `${acc} L ${x} ${y}`;
      },
      ''
    );
    
    return `${d} Z`;
  };

  return (
    <div className={`character-cell ${isActive ? 'active' : ''} ${confirmed ? 'confirmed' : ''}`}>
      <div className="cell-header">
        <span className="cell-number">{index + 1}</span>
        {confirmed ? (
          <span className="confirmed-badge">✓</span>
        ) : strokes.length > 0 && (
          <span className="stroke-count">{strokes.length} strokes</span>
        )}
      </div>
      
      {confirmed && (
        <div className="confirmed-character-display">
          <div className="confirmed-character">{confirmed.character}</div>
          <div className="confirmed-pinyin">{confirmed.pinyin}</div>
        </div>
      )}
      
      <div className={`cell-canvas-wrapper ${confirmed ? 'read-only' : ''}`}>
        <svg
          className="cell-canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {strokes.map((stroke, i) => (
            <path
              key={i}
              d={getSvgPathFromStroke(stroke.points)}
              fill="#FF69B4"
              stroke="none"
            />
          ))}
          {points.length > 0 && (
            <path
              d={getSvgPathFromStroke(points)}
              fill="#FF69B4"
              stroke="none"
            />
          )}
        </svg>
        
        {/* Grid lines for Chinese character writing */}
        <div className="cell-grid">
          <div className="grid-line horizontal" />
          <div className="grid-line vertical" />
          <div className="grid-line diagonal-1" />
          <div className="grid-line diagonal-2" />
        </div>
      </div>
      
      <div className="cell-actions">
        {!confirmed && (
          <button 
            className="cell-action-button confirm-button" 
            onClick={handleConfirm}
            disabled={strokes.length === 0}
            aria-label="Confirm character"
            title="Check"
          >
            ✓
          </button>
        )}
        {confirmed && (
          <button 
            className="cell-action-button cancel-confirm-button" 
            onClick={handleCancelConfirm}
            aria-label="Cancel confirmation"
            title="Cancel"
          >
            ✕
          </button>
        )}
        <button 
          className="cell-action-button clear-button" 
          onClick={(e) => handleClear(e)}
          disabled={strokes.length === 0 && points.length === 0}
          aria-label="Clear all strokes"
          title="Clear"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

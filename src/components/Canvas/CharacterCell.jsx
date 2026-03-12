import { useRef, useState, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { logPointerEvent } from '../DebugLog';
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
  onActivate,
  isAnyCellDrawing,
  onDrawingStart,
  onDrawingEnd,
}) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const pointerIdRef = useRef(null);
  const pointerTypeRef = useRef(null);
  const autoRecoveryTimerRef = useRef(null);
  
  // Cleanup function for auto-recovery timer
  useEffect(() => {
    return () => {
      if (autoRecoveryTimerRef.current) {
        clearTimeout(autoRecoveryTimerRef.current);
      }
    };
  }, []);
  
  const startAutoRecoveryTimer = useCallback(() => {
    // Clear any existing timer
    if (autoRecoveryTimerRef.current) {
      clearTimeout(autoRecoveryTimerRef.current);
    }
    
    // Set new timer - if drawing state is stuck for 3 seconds, auto-reset
    autoRecoveryTimerRef.current = setTimeout(() => {
      if (isDrawing) {
        logPointerEvent('AUTO-RECOVERY', { 
          reason: 'Drawing state stuck for 3 seconds',
          pointerId: pointerIdRef.current,
          pointsCount: points.length 
        });
        handleForceReset();
      }
    }, 3000);
  }, [isDrawing, points.length]);
  
  const clearAutoRecoveryTimer = useCallback(() => {
    if (autoRecoveryTimerRef.current) {
      clearTimeout(autoRecoveryTimerRef.current);
      autoRecoveryTimerRef.current = null;
    }
  }, []);
  
  const handleForceReset = useCallback(() => {
    logPointerEvent('STATE-RESET', { 
      reason: 'Forced reset',
      wasDrawing: isDrawing,
      hadPoints: points.length > 0 
    });
    
    // Release pointer capture if held
    if (pointerIdRef.current && canvasRef.current && canvasRef.current.releasePointerCapture) {
      try {
        canvasRef.current.releasePointerCapture(pointerIdRef.current);
      } catch (err) {
        // Ignore errors
      }
    }
    
    pointerIdRef.current = null;
    pointerTypeRef.current = null;
    setPoints([]);
    setIsDrawing(false);
    clearAutoRecoveryTimer();
    
    if (onDrawingEnd) {
      onDrawingEnd(index);
    }
  }, [isDrawing, points.length, index, onDrawingEnd, clearAutoRecoveryTimer]);

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
    logPointerEvent('POINTERDOWN', {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      isActive,
      isAnyCellDrawing,
      pressure: e.pressure,
    });

    if (!isActive) {
      // Activate this cell when clicked
      if (onActivate) {
        onActivate(index);
      }
      return;
    }

    // Check if another cell is already drawing
    if (isAnyCellDrawing) {
      logPointerEvent('POINTERDOWN-BLOCKED', {
        reason: 'Another cell is drawing',
        pointerId: e.pointerId,
      });
      return;
    }

    e.preventDefault();

    // Capture the pointer to ensure continuous tracking (critical for Apple Pencil)
    const canvas = canvasRef.current;
    if (canvas && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
        logPointerEvent('POINTER-CAPTURED', { pointerId: e.pointerId });
      } catch (err) {
        logPointerEvent('POINTER-CAPTURE-FAILED', {
          pointerId: e.pointerId,
          error: err.message,
        });
      }
    }

    // Store pointer info
    pointerIdRef.current = e.pointerId;
    pointerTypeRef.current = e.pointerType;

    // Notify parent that drawing has started
    if (onDrawingStart) {
      onDrawingStart(index);
      logPointerEvent('DRAWING-START', { cellIndex: index, pointerId: e.pointerId });
    }

    setIsDrawing(true);
    startAutoRecoveryTimer();
    const point = getPoint(e);
    setPoints([point]);
  }, [isActive, onActivate, index, isAnyCellDrawing, onDrawingStart, startAutoRecoveryTimer]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing || !isActive) return;

    // Only process move events for the captured pointer
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
      return;
    }

    e.preventDefault();

    // Reset auto-recovery timer on activity
    startAutoRecoveryTimer();

    // Capture all coalesced events for smooth Apple Pencil strokes
    const coalescedEvents = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

    setPoints((prev) => {
      const newPoints = [...prev];
      coalescedEvents.forEach(event => {
        newPoints.push(getPoint(event));
      });
      return newPoints;
    });
  }, [isDrawing, isActive, startAutoRecoveryTimer]);

  const handlePointerUp = useCallback((e) => {
    logPointerEvent('POINTERUP', {
      pointerId: e.pointerId,
      expectedPointerId: pointerIdRef.current,
      isDrawing,
      pointsCount: points.length,
    });

    // Only process if this is the captured pointer
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
      return;
    }

    clearAutoRecoveryTimer();

    if (!isDrawing || points.length === 0) {
      logPointerEvent('POINTERUP-NO-STROKE', {
        reason: isDrawing ? 'No points' : 'Not drawing',
      });
      handleForceReset();
      return;
    }

    const newStroke = {
      points: points.map(p => ({
        x: p.x,
        y: p.y,
        pressure: p.pressure,
        timestamp: p.timestamp
      })),
      startTime: points[0].timestamp,
      endTime: Date.now(),
      pointerType: pointerTypeRef.current || 'touch',
    };

    logPointerEvent('STROKE-COMPLETE', {
      pointsCount: points.length,
      pointerType: pointerTypeRef.current,
    });

    // Notify parent about the new stroke
    if (onStrokeComplete) {
      onStrokeComplete(index, newStroke);
    }

    handleForceReset();
  }, [isDrawing, points, index, onStrokeComplete, clearAutoRecoveryTimer, handleForceReset]);

  const handlePointerCancel = useCallback((e) => {
    logPointerEvent('POINTERCANCEL', {
      pointerId: e.pointerId,
      expectedPointerId: pointerIdRef.current,
      isDrawing,
    });

    // Only process if this is the captured pointer
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
      return;
    }

    clearAutoRecoveryTimer();
    handleForceReset();
  }, [isDrawing, clearAutoRecoveryTimer, handleForceReset]);

  const handleLostPointerCapture = useCallback((e) => {
    logPointerEvent('LOSTPOINTERCAPTURE', {
      pointerId: e.pointerId,
      expectedPointerId: pointerIdRef.current,
      isDrawing,
    });

    // Only process if this is the captured pointer
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
      return;
    }

    clearAutoRecoveryTimer();

    // If we lost capture but still have points, save the stroke
    if (isDrawing && points.length > 0) {
      const newStroke = {
        points: points.map(p => ({
          x: p.x,
          y: p.y,
          pressure: p.pressure,
          timestamp: p.timestamp
        })),
        startTime: points[0].timestamp,
        endTime: Date.now(),
        pointerType: pointerTypeRef.current || 'touch',
      };

      if (onStrokeComplete) {
        onStrokeComplete(index, newStroke);
      }
    }

    handleForceReset();
  }, [isDrawing, points, index, onStrokeComplete, clearAutoRecoveryTimer, handleForceReset]);

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

  const getSvgPathFromStroke = (strokePoints, strokePointerType) => {
    // Determine base size based on pointer type
    // Pen (Apple Pencil) gets thinner strokes, touch gets thicker
    const isPen = strokePointerType === 'pen' || pointerTypeRef.current === 'pen';
    const baseSize = isPen ? 10 : 16;
    
    // Use pressure data if available for variable stroke width
    const usePressure = strokePoints.some(p => p.pressure && p.pressure !== 0.5);
    const thinning = usePressure ? 0.7 : 0.5;
    
    const stroke = getStroke(strokePoints, {
      size: baseSize,
      thinning: thinning,
      smoothing: 0.5,
      streamline: 0.5,
      easing: (t) => t,
      start: {
        cap: true,
        taper: 0,
        easing: (t) => t,
      },
      end: {
        cap: true,
        taper: 0,
        easing: (t) => t,
      },
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
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
        >
          {strokes.map((stroke, i) => (
            <path
              key={i}
              d={getSvgPathFromStroke(stroke.points, stroke.pointerType)}
              fill="#FF69B4"
              stroke="none"
            />
          ))}
          {points.length > 0 && (
            <path
              d={getSvgPathFromStroke(points, pointerTypeRef.current)}
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

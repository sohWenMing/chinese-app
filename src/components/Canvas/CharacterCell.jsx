import { useRef, useState, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { logPointerEvent, logStrokeEvent } from '../DebugLog';
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
  const moveEventCountRef = useRef(0);
  const lostCaptureGracePeriodRef = useRef(null);
  const pendingLostCaptureDataRef = useRef(null);
  
  // Cleanup function for timers
  useEffect(() => {
    return () => {
      if (autoRecoveryTimerRef.current) {
        clearTimeout(autoRecoveryTimerRef.current);
      }
      if (lostCaptureGracePeriodRef.current) {
        clearTimeout(lostCaptureGracePeriodRef.current);
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
    
    // Clear any pending grace period
    if (lostCaptureGracePeriodRef.current) {
      clearTimeout(lostCaptureGracePeriodRef.current);
      lostCaptureGracePeriodRef.current = null;
    }
    pendingLostCaptureDataRef.current = null;
    
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

    // Check if we're in a grace period after lostpointercapture
    // If so, continue the previous stroke instead of starting a new one
    if (lostCaptureGracePeriodRef.current && pendingLostCaptureDataRef.current) {
      logPointerEvent('POINTERDOWN-RESUME', {
        pointerId: e.pointerId,
        reason: 'Continuing stroke after lostpointercapture grace period',
        previousPoints: pendingLostCaptureDataRef.current.points.length,
      });

      // Clear the grace period timer
      clearTimeout(lostCaptureGracePeriodRef.current);
      lostCaptureGracePeriodRef.current = null;

      // Capture the new pointer
      const canvas = canvasRef.current;
      if (canvas && canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
          logPointerEvent('POINTER-CAPTURED-RESUME', { pointerId: e.pointerId });
        } catch (err) {
          logPointerEvent('POINTER-CAPTURE-RESUME-FAILED', {
            pointerId: e.pointerId,
            error: err.message,
          });
        }
      }

      // Update pointer info
      pointerIdRef.current = e.pointerId;
      pointerTypeRef.current = e.pointerType;

      // Continue from where we left off
      setIsDrawing(true);
      startAutoRecoveryTimer();

      // Get the new point and append to existing points
      const newPoint = getPoint(e);
      setPoints([...pendingLostCaptureDataRef.current.points, newPoint]);

      // Clear the pending data
      pendingLostCaptureDataRef.current = null;

      // Log the resume
      logStrokeEvent(e, 'resume', {
        cellIndex: index,
        strokeNumber: strokes.length + 1,
        pointerType: e.pointerType,
        pressure: e.pressure,
        coordinates: { x: newPoint.x, y: newPoint.y },
        totalPoints: pendingLostCaptureDataRef.current ? pendingLostCaptureDataRef.current.points.length + 1 : 1,
      });

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

    // Log stroke start with detailed metadata
    logStrokeEvent(e, 'start', {
      cellIndex: index,
      strokeNumber: strokes.length + 1,
      isActive,
      pointerType: e.pointerType,
      pressure: e.pressure,
      coordinates: { x: point.x, y: point.y }
    });
  }, [isActive, onActivate, index, isAnyCellDrawing, onDrawingStart, startAutoRecoveryTimer, strokes.length]);

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

    // Throttled logging for move events (log every 10th event)
    moveEventCountRef.current++;
    if (moveEventCountRef.current % 10 === 0) {
      logStrokeEvent(e, 'move', {
        cellIndex: index,
        strokeNumber: strokes.length + 1,
        pointsCount: points.length,
        coordinates: { x: e.clientX, y: e.clientY },
        pressure: e.pressure
      });
    }
  }, [isDrawing, isActive, startAutoRecoveryTimer, index, strokes.length, points.length]);

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

    // Calculate stroke duration and average pressure
    const strokeDuration = points.length > 0 ? Date.now() - points[0].timestamp : 0;
    const avgPressure = points.length > 0
      ? points.reduce((sum, p) => sum + (p.pressure || 0.5), 0) / points.length
      : 0.5;

    // Log stroke completion with rich metadata
    logStrokeEvent(e, 'end', {
      cellIndex: index,
      strokeNumber: strokes.length + 1,
      totalStrokes: strokes.length + 1,
      pointsCount: points.length,
      strokeDuration: `${strokeDuration}ms`,
      avgPressure: `${Math.round(avgPressure * 100)}%`,
      pointerType: pointerTypeRef.current,
      success: true
    });

    // Notify parent about the new stroke
    if (onStrokeComplete) {
      onStrokeComplete(index, newStroke);
    }

    // Reset move event counter
    moveEventCountRef.current = 0;

    handleForceReset();
  }, [isDrawing, points, index, onStrokeComplete, clearAutoRecoveryTimer, handleForceReset, strokes.length]);

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

    // Log cancellation with reason
    logStrokeEvent(e, 'cancel', {
      cellIndex: index,
      strokeNumber: strokes.length + 1,
      pointsCount: points.length,
      reason: 'pointercancel event',
      pointerType: pointerTypeRef.current
    });

    clearAutoRecoveryTimer();
    handleForceReset();
  }, [isDrawing, clearAutoRecoveryTimer, handleForceReset, index, strokes.length, points.length]);

  const handleLostPointerCapture = useCallback((e) => {
    logPointerEvent('LOSTPOINTERCAPTURE', {
      pointerId: e.pointerId,
      expectedPointerId: pointerIdRef.current,
      isDrawing,
      pointsCount: points.length,
      willWait: isDrawing && points.length < 5, // Add this to indicate we're waiting
    });

    // Only process if this is the captured pointer
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
      return;
    }

    clearAutoRecoveryTimer();

    // For very short strokes (1-4 points), wait 100ms to see if user continues
    // This handles iPadOS aggressively reclaiming pointer capture
    if (isDrawing && points.length > 0 && points.length < 5) {
      logStrokeEvent(e, 'pause', {
        cellIndex: index,
        strokeNumber: strokes.length + 1,
        pointsCount: points.length,
        reason: 'lostpointercapture with few points - entering grace period',
        gracePeriod: '100ms'
      });

      // Store the current stroke data
      pendingLostCaptureDataRef.current = {
        points: [...points],
        startTime: points[0].timestamp,
        pointerType: pointerTypeRef.current || 'touch',
      };

      // Set grace period - if no new pointerdown in 100ms, treat as stroke end
      lostCaptureGracePeriodRef.current = setTimeout(() => {
        // Grace period expired - save the short stroke
        logStrokeEvent(e, 'end', {
          cellIndex: index,
          strokeNumber: strokes.length + 1,
          pointsCount: pendingLostCaptureDataRef.current.points.length,
          reason: 'grace period expired - saving short stroke',
          pointerType: pendingLostCaptureDataRef.current.pointerType,
          success: true
        });

        const newStroke = {
          points: pendingLostCaptureDataRef.current.points.map(p => ({
            x: p.x,
            y: p.y,
            pressure: p.pressure,
            timestamp: p.timestamp
          })),
          startTime: pendingLostCaptureDataRef.current.startTime,
          endTime: Date.now(),
          pointerType: pendingLostCaptureDataRef.current.pointerType,
        };

        if (onStrokeComplete) {
          onStrokeComplete(index, newStroke);
        }

        pendingLostCaptureDataRef.current = null;
        handleForceReset();
      }, 100);

      // Don't reset yet - wait for grace period or new pointer
      return;
    }

    // For longer strokes (5+ points), save immediately as before
    if (isDrawing && points.length >= 5) {
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

      logStrokeEvent(e, 'end', {
        cellIndex: index,
        strokeNumber: strokes.length + 1,
        pointsCount: points.length,
        reason: 'lostpointercapture with sufficient points',
        pointerType: pointerTypeRef.current,
        success: true
      });

      if (onStrokeComplete) {
        onStrokeComplete(index, newStroke);
      }
    }

    handleForceReset();
  }, [isDrawing, points, index, onStrokeComplete, clearAutoRecoveryTimer, handleForceReset, strokes.length]);

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

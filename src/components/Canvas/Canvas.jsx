import { useRef, useState, useCallback, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import './Canvas.css';

export function Canvas() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const point = getPoint(e);
    setPoints([point]);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getPoint(e);
    setPoints((prev) => [...prev, point]);
  }, [isDrawing]);

  const handlePointerUp = useCallback(() => {
    if (isDrawing && points.length > 0) {
      const strokeData = {
        points: points.map(p => ({ ...p })),
        startTime: points[0].timestamp,
        endTime: Date.now(),
      };
      
      console.log('Stroke captured:', strokeData);
      
      setStrokes((prev) => [...prev, points]);
      setPoints([]);
    }
    setIsDrawing(false);
  }, [isDrawing, points]);

  const handleClear = useCallback(() => {
    setStrokes([]);
    setPoints([]);
    console.log('Canvas cleared');
  }, []);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => e.preventDefault();
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const getSvgPathFromStroke = (points) => {
    const stroke = getStroke(points, {
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
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <svg
          className="canvas-svg"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {strokes.map((strokePoints, i) => (
            <path
              key={i}
              d={getSvgPathFromStroke(strokePoints)}
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
        <div className="canvas-grid">
          <div className="grid-line horizontal" />
          <div className="grid-line vertical" />
          <div className="grid-line diagonal-1" />
          <div className="grid-line diagonal-2" />
        </div>
      </div>
      <button className="clear-button" onClick={handleClear}>
        Clear Canvas
      </button>
    </div>
  );
}

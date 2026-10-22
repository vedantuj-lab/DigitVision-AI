import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, Send, Sliders, Wand2, Info } from 'lucide-react';

interface DrawingCanvasProps {
  onPredict: (dataUrl: string, method: 'canvas' | 'preset') => void;
  isLoading: boolean;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  size: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onPredict,
  isLoading,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(24);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [hasContent, setHasContent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize and redraw canvas
  const redrawAllStrokes = useCallback((allStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pitch black background matching MNIST standard
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    for (const stroke of allStrokes) {
      if (stroke.points.length === 0) continue;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const xc = (stroke.points[i].x + stroke.points[i - 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i - 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, xc, yc);
        }
        ctx.lineTo(
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y
        );
      }
      ctx.stroke();
    }
  }, []);

  // Setup canvas size with DPI handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;
    redrawAllStrokes(strokes);
  }, [redrawAllStrokes, strokes]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isLoading) return;
    if ('touches' in e) {
      // Prevent scrolling when drawing on touchscreen devices
      e.preventDefault();
    }
    const pt = getCanvasCoords(e);
    if (!pt) return;

    setIsDrawing(true);
    setErrorMsg(null);
    setCurrentStroke([pt]);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || isLoading) return;
    if ('touches' in e) {
      e.preventDefault();
    }
    const pt = getCanvasCoords(e);
    if (!pt) return;

    const updatedStroke = [...currentStroke, pt];
    setCurrentStroke(updatedStroke);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx && updatedStroke.length > 1) {
        const p1 = updatedStroke[updatedStroke.length - 2];
        const p2 = updatedStroke[updatedStroke.length - 1];
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      const newStrokes = [...strokes, { points: currentStroke, size: brushSize }];
      setStrokes(newStrokes);
      setCurrentStroke([]);
      setHasContent(true);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasContent(false);
    setErrorMsg(null);
    redrawAllStrokes([]);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const remaining = strokes.slice(0, strokes.length - 1);
    setStrokes(remaining);
    setHasContent(remaining.length > 0);
    redrawAllStrokes(remaining);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas has sufficient content
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let nonBlackCount = 0;
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 30) {
        nonBlackCount++;
      }
    }

    if (nonBlackCount < 20) {
      setErrorMsg('Canvas is empty or has too few strokes. Please draw a clear digit.');
      return;
    }

    setErrorMsg(null);
    const dataUrl = canvas.toDataURL('image/png');
    onPredict(dataUrl, 'canvas');
  };

  // Preset handwritten digits
  const loadPreset = (digit: number) => {
    handleClear();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 26;

    const w = canvas.width;
    const h = canvas.height;

    ctx.beginPath();
    if (digit === 0) {
      ctx.ellipse(w / 2, h / 2, 60, 95, 0, 0, Math.PI * 2);
    } else if (digit === 1) {
      ctx.moveTo(w / 2 - 20, h * 0.25);
      ctx.lineTo(w / 2 + 5, h * 0.18);
      ctx.lineTo(w / 2 + 5, h * 0.82);
    } else if (digit === 3) {
      ctx.moveTo(w * 0.32, h * 0.25);
      ctx.bezierCurveTo(w * 0.45, h * 0.18, w * 0.72, h * 0.22, w * 0.65, h * 0.45);
      ctx.bezierCurveTo(w * 0.52, h * 0.52, w * 0.45, h * 0.52, w * 0.45, h * 0.52);
      ctx.bezierCurveTo(w * 0.55, h * 0.52, w * 0.75, h * 0.55, w * 0.7, h * 0.78);
      ctx.bezierCurveTo(w * 0.62, h * 0.88, w * 0.4, h * 0.86, w * 0.3, h * 0.8);
    } else if (digit === 7) {
      ctx.moveTo(w * 0.28, h * 0.22);
      ctx.lineTo(w * 0.74, h * 0.22);
      ctx.lineTo(w * 0.42, h * 0.82);
    } else if (digit === 8) {
      ctx.ellipse(w / 2, h * 0.36, 45, 40, 0, 0, Math.PI * 2);
      ctx.ellipse(w / 2, h * 0.65, 55, 50, 0, 0, Math.PI * 2);
    }
    ctx.stroke();

    setHasContent(true);
    const dataUrl = canvas.toDataURL('image/png');
    onPredict(dataUrl, 'preset');
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Canvas Frame */}
      <div className="relative group">
        <div className="relative p-1 rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] shadow-xl shadow-black/50">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className={`w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-xl bg-black cursor-crosshair touch-none border border-white/10 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          {/* Subtle grid alignment crosshair */}
          <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/[0.05]" />
        </div>

        {/* Floating brush size indicator */}
        <div className="absolute -top-3 right-3 px-2 py-0.5 bg-[#171924] border border-white/10 rounded text-[11px] font-mono text-slate-300">
          {brushSize}px stroke
        </div>
      </div>

      {/* Error callout */}
      {errorMsg && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg max-w-sm text-center">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls: Brush Size Slider, Undo, Clear, Submit */}
      <div className="w-full max-w-[340px] mt-4 space-y-3">
        {/* Brush Size Slider */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Sliders className="w-3.5 h-3.5" />
            <span>Brush</span>
          </div>
          <input
            type="range"
            min="12"
            max="38"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lime-400"
          />
          <span className="font-mono text-slate-300 w-8 text-right">{brushSize}px</span>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0 || isLoading || disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.08] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            onClick={handleClear}
            disabled={!hasContent || isLoading || disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.08] rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!hasContent || isLoading || disabled}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-black bg-lime-400 hover:bg-lime-300 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-lime-400/20 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Predict</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets Strip */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-violet-400" />
              <span>Or test sample presets:</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            {[0, 1, 3, 7, 8].map((d) => (
              <button
                key={d}
                onClick={() => loadPreset(d)}
                disabled={isLoading || disabled}
                className="flex-1 py-1.5 text-xs font-mono font-bold text-slate-200 bg-white/[0.03] hover:bg-violet-600/20 hover:text-white hover:border-violet-500/40 border border-white/[0.06] rounded-md transition-colors text-center"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

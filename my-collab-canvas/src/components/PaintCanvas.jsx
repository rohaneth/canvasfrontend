import React, { useRef, useState, useEffect } from 'react';

const PaintCanvas = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState('brush');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    
    // Set initial canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.6;
    }

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  // Drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = ctxRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';

    if (tool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-100 p-4">
      <div className="flex gap-4 mb-4">
        {/* Tool Selection */}
        <button
          className={`p-2 rounded ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setTool('brush')}
        >
          🖌️
        </button>
        <button
          className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setTool('eraser')}
        >
          🗑️
        </button>

        {/* Color Picker */}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-12 h-8"
        />

        {/* Brush Size */}
        <div className="flex items-center">
          <span className="mr-2">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24"
          />
          <span>{brushSize}</span>
        </div>

        {/* Clear Canvas */}
        <button
          className="p-2 bg-red-500 text-white rounded"
          onClick={() => {
            const ctx = ctxRef.current;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          }}
        >
          Clear
        </button>
      </div>

      <div className="flex-1 bg-gray-100 p-4 rounded-lg shadow-lg">
        <canvas
          ref={canvasRef}
          className="w-full h-full border-4 border-blue-500 rounded-lg bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

export default PaintCanvas;

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { v4 as uuidv4 } from 'uuid';
import './Canvas.css';
import Chat from './Chat';

const Button = ({ children, className = '', onClick, ...props }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors mx-1 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Canvas = ({ canvasId = 'default' }) => {
  const canvasRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [selectedTool, setSelectedTool] = useState('freehand');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [username, setUsername] = useState('anonymous');
  const clientRef = useRef(null);
  const linkRef = useRef('');
  const creatorRef = useRef('');
  const canvasBackground = '#ffffff';

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const resp = await fetch('https://backendcanvas.onrender.com/api/auth/current-user', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.username) {
          setUsername(data.username);
          localStorage.setItem('username', data.username);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
    const stored = localStorage.getItem('username');
    if (stored) setUsername(stored);
    else {
      const uname = prompt('Enter username:');
      if (uname) {
        setUsername(uname);
        localStorage.setItem('username', uname);
      }
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (username === 'anonymous') return;

    const url = new URL(window.location.href);
    if (url.searchParams.has('creatorName')) {
      creatorRef.current = url.searchParams.get('creatorName');
      linkRef.current = window.location.href;
    } else {
      creatorRef.current = username;
      url.searchParams.set('creatorName', username);
      linkRef.current = url.toString();
    }

    const socket = new SockJS('https://backendcanvas.onrender.com/ws');
    clientRef.current = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP DEBUG:', str),
      onConnect: () => {
        console.log('Connected to WebSocket');
        clientRef.current.subscribe(
          `/topic/canvas/${creatorRef.current}/updates`,
          (msg) => handleRemoteMessage(msg)
        );
        if (creatorRef.current !== canvasId) {
          clientRef.current.subscribe(
            `/topic/canvas/${canvasId}/updates`,
            (msg) => handleRemoteMessage(msg)
          );
        }
      },
      onStompError: (frame) => console.error('Broker error:', frame.headers['message']),
    });
    clientRef.current.activate();
    return () => clientRef.current?.deactivate();
  }, [username]);

  const sendEvent = (event) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/canvas/${canvasId}/addShape`,
      body: JSON.stringify(event),
      headers: { 'content-type': 'application/json' },
    });
    console.log("sended event",event);
  };

  const handleRemoteMessage = (msg) => {
    try {
        const event = JSON.parse(msg.body);
        console.log(event);
      const { eventType, x, y, tool, color: evtColor, text, strokeWidth } = event;
      switch (eventType) {
        case 'mousedown':
          startShape({ x, y, tool, color: evtColor, text }, true);
          break;
        case 'mousemove':
          extendShape({ x, y }, true);
          break;
        case 'mouseup':
          endShape(true);
          break;
        case 'strokeWidth':
          setStrokeWidth(strokeWidth);
          break;
        default:
          console.warn('Unknown eventType:', eventType);
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Get the actual rendered size of the canvas
    const actualWidth = canvas.width;
    const actualHeight = canvas.height;
    // Calculate the scale factors
    const scaleX = actualWidth / rect.width;
    const scaleY = actualHeight / rect.height;
    
    // Calculate the position relative to the canvas
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  const startShape = ({ x, y, tool = 'freehand', color: c = '#000', text = '' }, remote = false) => {
    const isEraser = tool === 'eraser';
    const shape = {
      id: uuidv4(),
      type: tool === 'eraser' ? 'freehand' : tool,
      color: isEraser ? canvasBackground : c,
      strokeWidth,
      x,
      y,    
      width: 0,
      height: 0,
      radius: 0,
      points: tool === 'freehand' || tool === 'eraser' ? [{ x, y }] : [],
      text,
      fontSize: 16,
      fontFamily: 'Arial',
    };
    setCurrentShape(shape);
    if (!remote) sendEvent({ eventType: 'mousedown', x, y, tool, color: shape.color, text });
  };

  const extendShape = ({ x, y }, remote = false) => {
    setCurrentShape((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      if (updated.type === 'rectangle') {
        updated.width = x - updated.x;
        updated.height = y - updated.y;
      } else if (updated.type === 'circle') {
        const dx = x - updated.x;
        const dy = y - updated.y;
        updated.radius = Math.hypot(dx, dy);
      } else if (updated.type === 'freehand') {
        // Only add point if it's significantly different from the last point
        const lastPoint = updated.points[updated.points.length - 1];
        const distance = lastPoint ? 
          Math.hypot(x - lastPoint.x, y - lastPoint.y) : 0;
        
        if (distance > 1) { // Only add point if moved more than 1 pixel
          updated.points = [...updated.points, { x, y }];
        }
      }
      if (!remote) sendEvent({ eventType: 'mousemove', x, y });
      return updated;
    });
  };

  const endShape = (remote = false) => {
    setCurrentShape((prev) => {
      if (!prev) return null;
      setShapes((shapes) => [...shapes, prev]);
      if (!remote) sendEvent({ eventType: 'mouseup', x: 0, y: 0 });
      return null;
    });
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);
    startShape({ ...coords, tool: selectedTool, color });
  };

  const handleMouseMove = (e) => {
    if (!currentShape) return;
    const coords = getCanvasCoordinates(e);
    extendShape(coords);
  };

  const handleMouseUp = () => {
    if (!currentShape) return;
    endShape();
  };

  const linkcopy = () => {
    navigator.clipboard.writeText(linkRef.current);
    const timeoutId = setTimeout(() => {
        const text = document.createElement('div');
        text.style.position = 'fixed';
        text.style.top = '50%';
        text.style.left = '50%';
        text.style.transform = 'translate(-50%, -50%)';
        text.style.backgroundColor = 'black';
        text.style.color = 'white';
        text.style.padding = '10px';
        text.style.borderRadius = '5px';
        text.style.zIndex = '1000';
        text.textContent = 'Link copied to clipboard';
        document.body.appendChild(text);
        setTimeout(() => {
            document.body.removeChild(text);
        }, 1000);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fill with background color
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all shapes
    [...shapes, currentShape].forEach((shape) => {
      if (!shape) return;
      
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.type === 'rectangle') {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shape.type === 'freehand' && shape.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          const point = shape.points[i];
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }
    });
  }, [shapes, currentShape]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <Button
            onClick={() => setSelectedTool('freehand')}
            className={selectedTool === 'freehand' ? 'bg-blue-700' : ''}
          >
            Pencil
          </Button>
          <Button
            onClick={() => setSelectedTool('eraser')}
            className={selectedTool === 'eraser' ? 'bg-blue-700' : ''}
          >
            Eraser
          </Button>
          <Button
            onClick={() => setSelectedTool('rectangle')}
            className={selectedTool === 'rectangle' ? 'bg-blue-700' : ''}
          >
            Rectangle
          </Button>
          <Button
            onClick={() => setSelectedTool('circle')}
            className={selectedTool === 'circle' ? 'bg-blue-700' : ''}
          >
            Circle
          </Button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ marginLeft: '10px', verticalAlign: 'middle' }}
          />
          
          
          <Button onClick={() => setShapes([])} style={{ marginLeft: '10px' }}>
            Clear Canvas
          </Button>
          <Button onClick={() => linkcopy()}>
            Copy Link to share            
          </Button>
          <Button onClick={() => {
              const link = document.createElement('a');
              link.setAttribute('download', 'canvas.png');
              link.setAttribute(
                'href',
                canvasRef.current.toDataURL('image/png').replace('image/png', 'image/octet-stream')
              );
              link.click();
             

          }}>
            Save Canvas
          </Button>

        </div>
        <canvas
          ref={canvasRef}
          width={window.innerWidth - 400}
          height={window.innerHeight - 200}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ border: '1px solid #ccc', flex: 1, backgroundColor: canvasBackground }}
        />
      </div>
      <div style={{ width: '320px', height: '100vh', overflow: 'hidden' }}>
        <Chat />
      </div>
    </div>
  );
};

export default Canvas;

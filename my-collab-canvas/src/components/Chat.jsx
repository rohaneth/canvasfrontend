import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';



const STOMP_ENDPOINT = 'https://backendcanvas.onrender.com/ws';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClient = useRef(null);
  const [username, setUsername] = useState(null);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://backendcanvas.onrender.com/api/auth/current-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const username = await response.text();
        console.log('Current user:', username);
        setUsername(username);
      } else {
        console.error('Failed to get current user');
        setUsername(localStorage.getItem('username'));

      }
    } catch (error) {
      setUsername(localStorage.getItem('username'));
    }
  };

  // Call the async function
  fetchCurrentUser();

  useEffect(() => {
    const socket = new SockJS(STOMP_ENDPOINT);
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        setIsConnected(true);
        stompClient.current.subscribe('/topic/public', (message) => {
          const messageObj = JSON.parse(message.body);
          setMessages(prev => [...prev, messageObj]);

        });

      },
      onStompError: (frame) => {
        console.error('Broker error:', frame.headers['message']);
        console.error('Details:', frame.body);
      },
      onDisconnect: () => {
        setIsConnected(false);
      }
    });

    stompClient.current.activate();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [username]);

  const sendMessage = (message) => {
    if (!stompClient.current || !isConnected) return;

    stompClient.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        sender: username,
        content: message.content,
        type: 'CHAT'
      })
    });
    
  };

  return (
    <div style={{
      width: '320px',
      height: '100vh',
      backgroundColor: '#1F2937',
      padding: '16px',
      boxSizing: 'border-box',
      borderRight: '1px solid #374151',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      <h2 style={{
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: '12px',
        fontSize: '1.2rem',
        borderBottom: '1px solid #374151',
        paddingBottom: '8px'
      }}>
        Public Chat
      </h2>

      <div
        id="message-list"
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          backgroundColor: '#111827',
          borderRadius: '8px',
          padding: '8px',
          marginBottom: '12px',
          scrollbarWidth: 'thin'
        }}
      >
        {messages.map((message, index) => (
          <div key={index} style={{
            backgroundColor: '#374151',
            borderRadius: '6px',
            padding: '8px 10px',
            marginBottom: '6px',
            color: '#E5E7EB',
            fontSize: '0.9rem',
            textAlign: 'left',
            wordWrap: 'break-word'
          }}>
            <strong style={{ color: '#93C5FD' }}>
              {typeof message.sender === 'string' && message.sender.startsWith('{') 
                ? JSON.parse(message.sender).username 
                : message.sender}
            </strong>
            : {message.content}
            {message.type === 'JOIN' && (
              <span style={{ color: '#9CA3AF', fontStyle: 'italic', marginLeft: '6px' }}>joined the chat</span>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.target.elements.message;
          const content = input.value.trim();

          if (content) {
            sendMessage({
              sender: username,
              content,
              type: 'CHAT'
            });
            input.value = '';
          }
        }}
        style={{ display: 'flex', gap: '8px' }}
      >
        <input
          type="text"
          name="message"
          placeholder="Type a message..."
          style={{
            flexGrow: 1,
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#374151',
            color: '#FFFFFF',
            outline: 'none'
          }}
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected}
          style={{
            padding: '10px 16px',
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Send
        </button>
      </form>

      {!isConnected && (
        <div style={{
          color: '#FBBF24',
          marginTop: '10px',
          textAlign: 'center',
          fontSize: '0.85rem'
        }}>
          Connecting to chat...
        </div>
      )}
    </div>
  );
};

export default Chat;

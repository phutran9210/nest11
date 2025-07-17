# WebSocket Client Examples

## Basic Connection with Error Handling

```javascript
const io = require('socket.io-client');

// Connection configuration with automatic reconnection
const socket = io('http://localhost:3000/ws', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,        // Initial delay: 1s
  reconnectionDelayMax: 5000,     // Max delay: 5s
  maxReconnectionAttempts: 5,     // Max attempts
  timeout: 20000,                 // Connection timeout: 20s
  forceNew: false,
  auth: {
    token: 'your-jwt-token-here'  // JWT token for authentication
  }
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Reset reconnect attempts on successful connection
  reconnectAttempts = 0;
  
  // Start heartbeat
  startHeartbeat();
});

socket.on('connected', (data) => {
  console.log('📡 Connection confirmed:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
  stopHeartbeat();
  
  // Handle different disconnect reasons
  switch (reason) {
    case 'io server disconnect':
      console.log('🔄 Server initiated disconnect - will not auto-reconnect');
      break;
    case 'io client disconnect':
      console.log('🔄 Client initiated disconnect');
      break;
    case 'ping timeout':
      console.log('🔄 Connection timed out - will auto-reconnect');
      break;
    case 'transport close':
      console.log('🔄 Transport closed - will auto-reconnect');
      break;
    case 'transport error':
      console.log('🔄 Transport error - will auto-reconnect');
      break;
  }
});

// Reconnection handling
let reconnectAttempts = 0;

socket.on('reconnect', (attemptNumber) => {
  console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
  reconnectAttempts = attemptNumber;
  startHeartbeat();
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`🔄 Reconnection attempt ${attemptNumber}`);
  reconnectAttempts = attemptNumber;
});

socket.on('reconnect_error', (error) => {
  console.log('❌ Reconnection error:', error.message);
});

socket.on('reconnect_failed', () => {
  console.log('❌ Failed to reconnect after maximum attempts');
  // Implement custom reconnection logic or show user message
  handleMaxReconnectAttemptsExceeded();
});

// Server-side error events
socket.on('connection_error', (data) => {
  console.log('❌ Connection error from server:', data);
});

socket.on('reconnect_limit_exceeded', (data) => {
  console.log('❌ Reconnect limit exceeded:', data);
  handleMaxReconnectAttemptsExceeded();
});

socket.on('force_disconnect', (data) => {
  console.log('❌ Force disconnected by server:', data);
});

// Health check handling
socket.on('health_check', (data) => {
  console.log('💓 Health check from server:', data);
  // Respond with heartbeat
  socket.emit('heartbeat');
});

socket.on('heartbeat_ack', (data) => {
  console.log('💓 Heartbeat acknowledged:', data);
});

// Ping/Pong for connection health
socket.on('pong', (data) => {
  console.log('🏓 Pong received:', data);
});

// Connection monitoring
let heartbeatInterval;

function startHeartbeat() {
  // Send ping every 10 seconds
  heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping');
      socket.emit('heartbeat');
    }
  }, 10000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Handle maximum reconnect attempts exceeded
function handleMaxReconnectAttemptsExceeded() {
  // Show user notification
  showNotification('Connection lost. Please refresh the page or check your internet connection.', 'error');
  
  // Optional: Attempt manual reconnection after delay
  setTimeout(() => {
    console.log('🔄 Attempting manual reconnection...');
    socket.connect();
  }, 30000); // Wait 30 seconds before manual retry
}

// Utility function to show notifications (implement based on your UI)
function showNotification(message, type) {
  console.log(`${type.toUpperCase()}: ${message}`);
  // Implement your notification system here
}

// Example usage with authentication
function connectWithAuth(token) {
  socket.auth.token = token;
  socket.connect();
}

// Example usage for joining rooms with error handling
function joinRoom(roomName) {
  if (!socket.connected) {
    console.log('❌ Cannot join room: not connected');
    return;
  }
  
  socket.emit('join-room', { room: roomName });
  
  socket.on('joined-room', (data) => {
    console.log('✅ Successfully joined room:', data);
  });
  
  socket.on('error', (error) => {
    console.log('❌ Error joining room:', error);
  });
}

// Graceful shutdown
function disconnect() {
  stopHeartbeat();
  socket.disconnect();
}

// Listen for browser/tab close to cleanup
window.addEventListener('beforeunload', () => {
  disconnect();
});
```

## React Hook Example

```javascript
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export function useWebSocket(token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const heartbeatRef = useRef();

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000/ws', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      timeout: 20000,
      auth: { token }
    });

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('Connected:', newSocket.id);
      setConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      startHeartbeat(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnected(false);
      stopHeartbeat();
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setReconnectAttempts(attemptNumber);
      setConnected(true);
      setConnectionError(null);
      startHeartbeat(newSocket);
    });

    newSocket.on('reconnect_error', (error) => {
      console.log('Reconnection error:', error);
      setConnectionError(error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('Failed to reconnect');
      setConnectionError('Failed to reconnect after maximum attempts');
    });

    newSocket.on('connection_error', (data) => {
      console.log('Connection error:', data);
      setConnectionError(data.error);
    });

    setSocket(newSocket);

    const startHeartbeat = (socketInstance) => {
      heartbeatRef.current = setInterval(() => {
        if (socketInstance.connected) {
          socketInstance.emit('heartbeat');
        }
      }, 10000);
    };

    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    return () => {
      stopHeartbeat();
      newSocket.close();
    };
  }, [token]);

  return {
    socket,
    connected,
    connectionError,
    reconnectAttempts
  };
}
```

## Connection Monitoring Dashboard

```javascript
// Admin dashboard for monitoring WebSocket connections
class WebSocketMonitor {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.refreshInterval = null;
  }

  async getServerHealth() {
    try {
      const response = await this.apiClient.get('/websocket/health');
      return response.data;
    } catch (error) {
      console.error('Failed to get server health:', error);
      return null;
    }
  }

  async getConnectionStats() {
    try {
      const response = await this.apiClient.get('/websocket/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return null;
    }
  }

  async forceDisconnectClient(clientId, reason) {
    try {
      const response = await this.apiClient.delete(`/websocket/client/${clientId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to disconnect client:', error);
      return null;
    }
  }

  async broadcastMessage(event, data) {
    try {
      const response = await this.apiClient.post('/websocket/broadcast', {
        event,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      return null;
    }
  }

  startMonitoring(callback, interval = 5000) {
    this.refreshInterval = setInterval(async () => {
      const health = await this.getServerHealth();
      const stats = await this.getConnectionStats();
      callback({ health, stats });
    }, interval);
  }

  stopMonitoring() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
```
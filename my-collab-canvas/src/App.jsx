import { useState, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import PaintCanvas from './components/PaintCanvas'
import Login from './components/Login'
import Register from './components/Register'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Chat from './components/Chat'
import Canvas from './components/Canvas'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <PaintCanvas />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat" element={
            <Chat />
          } />
          <Route path="/canvas" element={
            <Canvas />
          } />

        </Routes>
      </Router>
    </AuthProvider>
  )
}

// Component to access user context
const ChatWithUser = () => {
  const { user } = useAuth();
  return <Chat username={user?.username} />;
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default App

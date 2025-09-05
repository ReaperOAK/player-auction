import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AuctionProvider } from './context/AuctionContext'

// Page imports
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import TeamDashboard from './pages/TeamDashboard'
import ViewerDashboard from './pages/ViewerDashboard'

// Component imports
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import SocketStatus from './components/SocketStatus'
import SocketDebugger from './components/SocketDebugger'

function App() {
  return (
    <AuthProvider>
      <AuctionProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/watch" element={<ViewerDashboard />} />
                
                {/* Protected routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <ProtectedRoute allowedRoles={['team']}>
                      <TeamDashboard />
                    </ProtectedRoute>
                  }
                />
                
                {/* Default redirects */}
                <Route path="/" element={<Navigate to="/watch" replace />} />
                <Route path="*" element={<Navigate to="/watch" replace />} />
              </Routes>
            </main>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#22c55e',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
            
            {/* Socket connection status indicator */}
            <SocketStatus />
            
            {/* Socket event debugger */}
            <SocketDebugger />
          </div>
        </Router>
      </AuctionProvider>
    </AuthProvider>
  )
}

export default App

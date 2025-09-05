import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { Eye, Shield, Users, Lock } from 'lucide-react'

const LoginPage = () => {
  const [loginType, setLoginType] = useState('viewer') // viewer, admin, team
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (loginType === 'viewer') {
      // Redirect to viewer dashboard without authentication
      navigate('/watch')
      return
    }

    if (!credentials.username || !credentials.password) {
      toast.error('Please enter username and password')
      return
    }

    setLoading(true)

    try {
      let response
      if (loginType === 'admin') {
        response = await authApi.adminLogin(credentials)
      } else {
        response = await authApi.teamLogin(credentials)
      }

      const { token, user } = response.data
      login(token, user)
      
      toast.success(`Welcome, ${user.name || user.username}!`)
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/team')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  const loginOptions = [
    {
      type: 'viewer',
      title: 'Watch Live',
      description: 'View the auction as a spectator',
      icon: Eye,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    {
      type: 'admin',
      title: 'Admin Login',
      description: 'Control and manage the auction',
      icon: Shield,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50'
    },
    {
      type: 'team',
      title: 'Team Login',
      description: 'Participate in bidding',
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    }
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Player Auction
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose how you'd like to participate
          </p>
        </div>

        {/* Login Type Selection */}
        <div className="space-y-4">
          {loginOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <button
                key={option.type}
                onClick={() => setLoginType(option.type)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  loginType === option.type
                    ? `border-${option.color.split('-')[1]}-500 ${option.bgColor}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-medium ${loginType === option.type ? option.textColor : 'text-gray-900'}`}>
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Login Form */}
        {loginType !== 'viewer' && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={credentials.username}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary btn-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {loginType === 'admin' && <Shield className="w-4 h-4" />}
                  {loginType === 'team' && <Users className="w-4 h-4" />}
                  <span>
                    {loginType === 'admin' ? 'Login as Admin' : 'Login as Team'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Direct action for viewer */}
        {loginType === 'viewer' && (
          <button
            onClick={() => navigate('/watch')}
            className="w-full btn-success btn-lg flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Start Watching</span>
          </button>
        )}

        {/* Help text */}
        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            {loginType === 'admin' && (
              <p>Admin credentials: admin / admin123</p>
            )}
            {loginType === 'team' && (
              <div>
                <p>Team credentials examples:</p>
                <p>alpha / alpha123, beta / beta123, etc.</p>
              </div>
            )}
            {loginType === 'viewer' && (
              <p>No account needed to watch the auction live</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

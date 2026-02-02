import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const SessionManager = ({ roomId, onClose }) => {
  const [sessionName, setSessionName] = useState('')
  const [savedSessions, setSavedSessions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/sessions`)
      setSavedSessions(response.data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const saveSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/sessions`, {
        roomId,
        sessionName: sessionName.trim(),
      })
      toast.success('Session saved successfully')
      setSessionName('')
      loadSessions()
      onClose()
    } catch (error) {
      toast.error('Failed to save session')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-700 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Session Manager</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Save Current Session
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name..."
              className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={saveSession}
              disabled={loading}
              className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Session'}
            </button>
          </div>

          {savedSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Saved Sessions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedSessions.map((session) => (
                  <div
                    key={session.roomId}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">{session.sessionName}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Created: {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/editorpage/${session.roomId}`)
                          toast.success('Session link copied!')
                        }}
                        className="ml-3 text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="Copy link"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionManager

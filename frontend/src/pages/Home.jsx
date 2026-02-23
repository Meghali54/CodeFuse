import React, { useState, useEffect } from 'react'
import editorImg from "../assets/editor.svg";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthModal from '../components/AuthModal';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [savedSessions, setSavedSessions] = useState([]);
  const [showSavedSessions, setShowSavedSessions] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.roomId) {
      setRoomId(location.state.roomId);
      toast.info("Join room to continue");
    }
  }, [location.state]);

  useEffect(() => {
    const handleOAuthToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (token) {
        localStorage.setItem('token', token);
        // Clean URL to remove token
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
            setUsername(response.data.user.username);
            toast.success(`Welcome, ${response.data.user.username}!`);
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
          toast.error("Authentication failed. Please try again.");
          localStorage.removeItem('token');
        }
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setUsername(JSON.parse(storedUser).username);
        }
      }
    };

    handleOAuthToken();
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/sessions`);
      setSavedSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const createRoomId = (e) => {
    e.preventDefault();
    const id = uuidv4()
    setRoomId(id);
    toast.success("Room created");
  }
  const isFormFilled = roomId.trim() !== "" && username.trim() !== "";

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Put both fields");
      return;
    }
    navigate(`/editorpage/${roomId}`, {
      state: {
        username
      }
    })
  }

  const joinSession = (sessionRoomId) => {
    if (!username.trim()) {
      toast.error("Please enter your username first");
      return;
    }
    navigate(`/editorpage/${sessionRoomId}`, {
      state: {
        username
      }
    })
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUsername('');
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-indigo-950 flex flex-col">
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <img src={editorImg} alt="logo" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-white">CodeFusion</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-zinc-300">Welcome, <span className="text-white font-semibold">{user.username}</span></span>
              <span className='text-gray-400'>|</span>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-zinc-300 hover:text-white font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMm0tNiAwYzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="w-full max-w-6xl relative z-10 grid md:grid-cols-2 gap-8">

          {/* Left Panel - Branding & Info */}
          <div className="flex flex-col justify-center space-y-8 text-white">
            <div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Collaborate in <br /> Real-Time
              </h1>
              <p className="text-2xl text-zinc-400">Code together, chat, and build faster.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Real-Time Collaboration</h3>
                  <p className="text-zinc-400">See live cursors, edit together instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">In-Editor Chat</h3>
                  <p className="text-zinc-400">Discuss code without leaving the editor</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Multi-Language Support</h3>
                  <p className="text-zinc-400">JavaScript, Python, Java, C++ & more</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
                <p className="text-zinc-400">Join an existing room or create a new one</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className='w-full bg-zinc-800 text-white py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Room ID</label>
                  <input
                    type="text"
                    placeholder="Enter or create room ID"
                    className='w-full bg-zinc-800 text-white py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all'
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${isFormFilled
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    }`}
                  disabled={!isFormFilled}
                  onClick={joinRoom}
                >
                  Join Room
                </button>

                <button
                  className="w-full border-2 border-zinc-700 hover:border-indigo-500 py-3 rounded-xl font-semibold text-white hover:bg-zinc-800 transition-all duration-200"
                  onClick={createRoomId}
                >
                  Create New Room
                </button>
              </div>

              {savedSessions.length > 0 && (
                <div className="pt-6 border-t border-zinc-800">
                  <button
                    onClick={() => setShowSavedSessions(!showSavedSessions)}
                    className="w-full flex items-center justify-between text-left text-zinc-300 hover:text-white transition-colors"
                  >
                    <span className="font-semibold">Saved Sessions ({savedSessions.length})</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${showSavedSessions ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showSavedSessions && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {savedSessions.map((session) => (
                        <div
                          key={session.roomId}
                          className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-indigo-500 transition-all cursor-pointer group"
                          onClick={() => joinSession(session.roomId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                                {session.sessionName}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {new Date(session.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  )
}

export default Home

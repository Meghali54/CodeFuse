import React, { useEffect, useRef, useState } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import { initSocket } from '../socket'
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import Select from './Select'

// Load Monaco from CDN (optional, but good for performance)
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

const CodeEditor = ({ setUsers }) => {
  const socketRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Refs for mute/state management to prevent loops
  const isRemoteUpdate = useRef(false)
  const codeRef = useRef('')
  const languageRef = useRef('javascript')
  const decorationsRef = useRef([])
  const selfColorRef = useRef('#94A3B8')

  const [code, setCode] = useState('/*write your code here !!!*/')
  const [language, setLanguage] = useState('javascript')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  // Store remote cursors: { [socketId]: { username, color, lineNumber, column } }
  const [remoteCursors, setRemoteCursors] = useState({})

  const username = location.state?.username

  // Language mapping for Monaco
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'sql', label: 'SQL' },
    { value: 'csharp', label: 'C#' },
    { value: 'swift', label: 'Swift' },
    { value: 'ruby', label: 'Ruby' },
  ]

  // --- Session Loading ---
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/sessions/${roomId}`)
        if (response.data && response.data.success !== false) {
          setCode(response.data.code || '/*write your code here !!!*/')
          codeRef.current = response.data.code || '/*write your code here !!!*/'
          setLanguage(response.data.language || 'javascript')
          languageRef.current = response.data.language || 'javascript'
          toast.success('Session loaded!')
        } else {
          console.log('No existing session found, starting fresh')
        }
      } catch (error) {
        console.log('Error loading session', error)
      }
    }
    loadSession()
  }, [roomId])

  // --- Cursor Rendering Logic ---
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current

    const newDecorations = []

    Object.entries(remoteCursors).forEach(([socketId, cursorData]) => {
      // Need a valid position
      if (!cursorData.lineNumber || !cursorData.column) return

      // Create a style for the cursor line/position
      // We can use className for the cursor content or glyph margin
      // Simplest approach for "cursor" in Monaco is adding a class 
      // but Monaco doesn't support "arbitrary" HTML elements easily at text pos.
      // We'll use:
      // 1. className: background color for selection-like effect (or just a thin line if we can style it)
      // 2. beforeContentClassName or afterContentClassName for the name tag

      // Since we need dynamic colors, we must inject CSS or use a known set of classes.
      // For simplicity/performance, let's inject a style tag for this user if needed, 
      // or use a predefined color class if the palette is fixed. 
      // The backend assigns colors from a palette.

      const cursorColor = cursorData.color || '#94A3B8'
      const cursorClass = `remote-cursor-${socketId}`
      const labelClass = `remote-label-${socketId}`

      // Inject dynamic CSS for this user's color
      if (!document.getElementById(`style-${socketId}`)) {
        const style = document.createElement('style')
        style.id = `style-${socketId}`
        style.innerHTML = `
          .${cursorClass} {
            border-left: 2px solid ${cursorColor};
            margin-left: -1px;
          }
          .${labelClass}::after {
            content: "${cursorData.username}";
            position: absolute;
            top: -1.2em;
            left: 0;
            background: ${cursorColor};
            color: #111827;
            font-size: 0.7rem;
            padding: 2px 4px;
            border-radius: 4px;
            white-space: nowrap;
            z-index: 10;
          }
        `
        document.head.appendChild(style)
      }

      newDecorations.push({
        range: new monaco.Range(
          cursorData.lineNumber,
          cursorData.column,
          cursorData.lineNumber,
          cursorData.column
        ),
        options: {
          className: cursorClass, // The vertical line
          afterContentClassName: labelClass, // The name tag
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })
    })

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)

    // Cleanup styles for disconnected users could be done, but minor leak for now.

  }, [remoteCursors])

  // --- Socket Logic ---
  useEffect(() => {
    const handleError = (err) => {
      console.log('socket error:', err)
    }

    if (socketRef.current) return
    socketRef.current = initSocket()

    socketRef.current.on('connect_error', handleError)
    socketRef.current.on('connect_failed', handleError)

    socketRef.current.on('connect', () => {
      console.log('socket connected:', socketRef.current.id)
      toast.success('Connected to server')

      socketRef.current.emit('join', {
        roomId,
        username,
      })
    })

    socketRef.current.on('joined', ({ clients, username: joinedUser, socketId }) => {
      if (joinedUser !== username) {
        toast.success(`${joinedUser} joined`)
      }
      setUsers(clients)

      const self = clients.find((client) => client.socketId === socketRef.current.id)
      if (self?.color) {
        selfColorRef.current = self.color
      }

      if (socketId !== socketRef.current.id) {
        socketRef.current.emit('sync-state', {
          code: codeRef.current,
          language: languageRef.current,
          socketId,
        })
      }
    })

    socketRef.current.on('disconnected', ({ clients, username: leftUser }) => {
      toast.info(`${leftUser} left`)
      setUsers(clients)

      // Cleanup cursor styles if possible
      // (Implementation detail found in many production apps: keep it simple)
    })

    socketRef.current.on('code-changed', ({ code }) => {
      if (code !== codeRef.current) {
        isRemoteUpdate.current = true
        setCode(code)
        codeRef.current = code
        // For Monaco, setting value is handled by the component's `value` prop 
        // OR we can directly call editor.setValue() if using uncontrolled.
        // The @monaco-editor/react component handles `value` prop updates.
      }
    })

    socketRef.current.on('sync-state', ({ code, language: syncedLanguage }) => {
      isRemoteUpdate.current = true
      setCode(code)
      codeRef.current = code
      if (syncedLanguage) {
        setLanguage(syncedLanguage)
        languageRef.current = syncedLanguage
      }
    })

    socketRef.current.on('language-changed', ({ language: newLanguage }) => {
      if (!newLanguage) return
      setLanguage(newLanguage)
      languageRef.current = newLanguage
    })

    socketRef.current.on('chat-message', ({ message, username: messageUser, timestamp, color }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${timestamp}-${messageUser}-${Math.random()}`,
          message,
          username: messageUser,
          timestamp,
          color,
        },
      ])
    })

    socketRef.current.on('cursor-change', ({ socketId, cursor, username: cursorUser, color }) => {
      // Expecting cursor to be { lineNumber, column }
      setRemoteCursors((prev) => ({
        ...prev,
        [socketId]: { ...cursor, username: cursorUser, color },
      }))
    })

    socketRef.current.on('cursor-removed', ({ socketId }) => {
      setRemoteCursors((prev) => {
        const updated = { ...prev }
        delete updated[socketId]
        return updated
      })
      // Remove style tag
      const style = document.getElementById(`style-${socketId}`)
      if (style) style.remove()
    })

    return () => {
      if (socketRef.current) {
        console.log('disconnecting socket:', socketRef.current.id)
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [roomId, username, setUsers])

  if (!location.state) {
    return <Navigate to="/" state={{ roomId }} />
  }

  // --- Handlers ---

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Add cursor change listener
    editor.onDidChangeCursorPosition((e) => {
      const { position } = e
      const cursor = {
        lineNumber: position.lineNumber,
        column: position.column
      }

      socketRef.current?.emit('cursor-change', {
        roomId,
        cursor,
        username,
        color: selfColorRef.current
      })
    })

    // Add content change listener if not using onChange prop
    // Actually the onChange prop is sufficient for code, 
    // but let's stick to the props provided by the wrapper.
  }

  const handleEditorChange = (value, event) => {
    // If update comes from remote, verify it's not a loop
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }

    codeRef.current = value
    setCode(value)

    socketRef.current?.emit('code-change', {
      roomId,
      code: value,
    })
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    languageRef.current = newLanguage

    socketRef.current?.emit('language-change', {
      roomId,
      language: newLanguage,
    })
  }

  const handleSendMessage = (event) => {
    event.preventDefault()
    if (!chatInput.trim()) return
    const timestamp = Date.now()

    socketRef.current?.emit('chat-message', {
      roomId,
      message: chatInput.trim(),
      username,
      timestamp,
      color: selfColorRef.current,
    })

    setChatInput('')
  }

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 text-sm text-white">
        <div className="flex items-center gap-3">
          <span className="text-zinc-300">Language:</span>
          <div className="w-48">
            <Select
              options={languageOptions}
              value={language}
              onChange={handleLanguageChange}
              placeholder="Select Language"
            />
          </div>
        </div>
        <span className="text-zinc-400">Monaco Editor · Real-time sync · Live cursors</span>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>

        <div className="w-80 flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 text-white">
          <div className="px-3 py-2 border-b border-zinc-700 text-sm font-semibold">Team Chat</div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-zinc-500">Start chatting with your team.</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.username === username ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: msg.color || '#94A3B8' }}
                  />
                  <span>{msg.username}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${msg.username === username ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-700">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold hover:bg-indigo-500"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor

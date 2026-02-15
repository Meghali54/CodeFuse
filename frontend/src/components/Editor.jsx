import React, { useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { linter, lintGutter } from '@codemirror/lint'
import { syntaxTree } from '@codemirror/language'
import { EditorView, Decoration, WidgetType } from '@codemirror/view'
import { StateEffect, StateField } from '@codemirror/state'
import { initSocket } from '../socket'
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'

const languageOptions = [
  { key: 'javascript', label: 'JavaScript', extension: javascript() },
  { key: 'python', label: 'Python', extension: python() },
  { key: 'java', label: 'Java', extension: java() },
  { key: 'cpp', label: 'C++', extension: cpp() },
]

const syntaxErrorLinter = linter((view) => {
  const diagnostics = []
  const tree = syntaxTree(view.state)
  tree.iterate({
    enter: (node) => {
      if (node.type.isError) {
        const from = node.from
        const to = Math.max(node.to, from + 1)
        diagnostics.push({
          from,
          to,
          severity: 'error',
          message: 'Syntax error',
        })
      }
    },
  })
  return diagnostics
})

class RemoteCursorWidget extends WidgetType {
  constructor(username, color) {
    super()
    this.username = username
    this.color = color
  }

  toDOM() {
    const wrap = document.createElement('span')
    wrap.style.position = 'relative'
    wrap.style.borderLeft = `4px solid ${this.color}`
    wrap.style.marginLeft = '-2px'
    wrap.style.height = '1.7em'

    const label = document.createElement('span')
    label.textContent = this.username
    label.style.position = 'absolute'
    label.style.top = '-1.4em'
    label.style.left = '-1px'
    label.style.background = this.color
    label.style.color = '#111827'
    label.style.fontSize = '0.65rem'
    label.style.padding = '2px 4px'
    label.style.borderRadius = '4px'
    label.style.whiteSpace = 'nowrap'

    wrap.appendChild(label)
    return wrap
  }
}

const setRemoteCursorsEffect = StateEffect.define()

const remoteCursorsField = StateField.define({
  create() {
    return Decoration.none
  },
  update(cursors, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setRemoteCursorsEffect)) {
        return effect.value
      }
    }
    return cursors.map(tr.changes)
  },
  provide: (f) => EditorView.decorations.from(f),
})

const Editor = ({ setUsers }) => {
  const socketRef = useRef(null)
  const viewRef = useRef(null)
  const location = useLocation()
  const { roomId } = useParams()
  const navigate = useNavigate()
  const codeRef = useRef('')
  const languageRef = useRef('javascript')
  const isRemoteUpdate = useRef(false)
  const selfColorRef = useRef('#94A3B8')

  const [code, setCode] = useState('/*write your code here !!!*/')
  const [language, setLanguage] = useState('javascript')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [remoteCursors, setRemoteCursors] = useState({})

  const username = location.state?.username

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/sessions/${roomId}`);
        if (response.data && response.data.success !== false) {
          setCode(response.data.code || '/*write your code here !!!*/');
          codeRef.current = response.data.code || '/*write your code here !!!*/';
          setLanguage(response.data.language || 'javascript');
          languageRef.current = response.data.language || 'javascript';
          toast.success('Session loaded!');
        } else {
          console.log('No existing session found, starting fresh');
        }
      } catch (error) {
        console.log('Error loading session', error);
      }
    };

    loadSession();
  }, [roomId]);

  const currentLanguageExtension = useMemo(() => {
    const selected = languageOptions.find((item) => item.key === language)
    return selected ? selected.extension : javascript()
  }, [language])

  const updateRemoteDecorations = () => {
    if (!viewRef.current) return

    const decorations = []
    Object.entries(remoteCursors).forEach(([socketId, cursorData]) => {
      if (!cursorData?.cursor) return
      const { head } = cursorData.cursor
      const safeHead = Math.min(head, viewRef.current.state.doc.length)
      decorations.push(
        Decoration.widget({
          widget: new RemoteCursorWidget(cursorData.username, cursorData.color),
          side: 1,
        }).range(safeHead)
      )
    })

    viewRef.current.dispatch({
      effects: setRemoteCursorsEffect.of(Decoration.set(decorations, true)),
    })
  }

  useEffect(() => {
    updateRemoteDecorations()
  }, [remoteCursors])

  useEffect(() => {
    const handleError = (err) => {
      console.log('socket error:', err)
      // toast.error('Socket connection failed') // suppression: too noisy
    }

    if (socketRef.current) return;
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
    })

    socketRef.current.on('code-changed', ({ code }) => {
      isRemoteUpdate.current = true
      setCode(code)
      codeRef.current = code
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
      setRemoteCursors((prev) => ({
        ...prev,
        [socketId]: { cursor, username: cursorUser, color },
      }))
    })

    socketRef.current.on('cursor-removed', ({ socketId }) => {
      setRemoteCursors((prev) => {
        const updated = { ...prev }
        delete updated[socketId]
        return updated
      })
    })

    return () => {
      if (socketRef.current) {
        console.log('disconnecting socket:', socketRef.current.id)

        socketRef.current.off('connect_error')
        socketRef.current.off('connect_failed')
        socketRef.current.off('joined')
        socketRef.current.off('disconnected')
        socketRef.current.off('code-changed')
        socketRef.current.off('sync-state')
        socketRef.current.off('language-changed')
        socketRef.current.off('chat-message')
        socketRef.current.off('cursor-change')
        socketRef.current.off('cursor-removed')

        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  if (!location.state) {
    return <Navigate to="/" state={{ roomId }} />
  }

  const handleCodeChange = (newCode) => {
    codeRef.current = newCode
    setCode(newCode)

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }

    if (socketRef.current) {
      socketRef.current.emit('code-change', {
        roomId,
        code: newCode,
      })
    }
  }

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value
    setLanguage(nextLanguage)
    languageRef.current = nextLanguage

    if (socketRef.current) {
      socketRef.current.emit('language-change', {
        roomId,
        language: nextLanguage,
      })
    }
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

  const cursorListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet || !socketRef.current) return
        const { anchor, head } = update.state.selection.main

        socketRef.current.emit('cursor-change', {
          roomId,
          cursor: { anchor, head },
          username,
          color: selfColorRef.current,
        })
      }),
    [roomId, username]
  )

  const extensions = useMemo(
    () => [
      currentLanguageExtension,
      lintGutter(),
      syntaxErrorLinter,
      cursorListener,
      remoteCursorsField,
      EditorView.lineWrapping,
    ],
    [currentLanguageExtension, cursorListener]
  )

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 text-sm text-white">
        <div className="flex items-center gap-3">
          <span className="text-zinc-300">Language</span>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-zinc-900 text-white border border-zinc-700 rounded px-2 py-1"
          >
            {languageOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-zinc-400">Real-time sync · Live cursors · Linting</span>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          <CodeMirror
            value={code}
            height="100%"
            extensions={extensions}
            onChange={handleCodeChange}
            onCreateEditor={(view) => {
              viewRef.current = view
              updateRemoteDecorations()
            }}
            theme="dark"
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

export default Editor

import { useEffect, useRef, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { initSocket } from "../socket";
import { useLocation, useParams, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Select from "./Select";
import FileExplorer from "./FileExplorer";
import { customThemes } from "../constants/customThemes";
import { 
  getLanguageFromFilename, 
  generateFileId, 
  isValidFilename,
  getDefaultTemplate 
} from "../utils/fileUtils";

// Load Monaco from CDN (optional, but good for performance)
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" },
});

const CodeEditor = ({ setUsers, setIsAdmin, setSocketRef, setJoinRequests }) => {
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Refs for mute/state management to prevent loops
  const isRemoteUpdate = useRef(false);
  const filesRef = useRef([{ id: 'default', name: 'main.js', code: '// Write your code here', language: 'javascript' }]);
  const activeFileRef = useRef('default');
  const decorationsRef = useRef([]);
  const selfColorRef = useRef("#94A3B8");

  const [files, setFiles] = useState([{ id: 'default', name: 'main.js', code: '// Write your code here', language: 'javascript' }]);
  const [activeFile, setActiveFile] = useState('default');
  const [theme, setTheme] = useState("vs-dark");
  const [wordWrap, setWordWrap] = useState("on");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  // Store remote cursors: { [socketId]: { username, color, lineNumber, column, fileId } }
  const [remoteCursors, setRemoteCursors] = useState({});
  const [isApproved, setIsApproved] = useState(false);

  const username = location.state?.username;

  // Get current active file data
  const currentFile = files.find(f => f.id === activeFile) || files[0];
  const code = currentFile?.code || '';
  const language = currentFile?.language || 'javascript';

  const themeOptions = [
    { value: "vs-dark", label: "VS Dark" },
    { value: "light", label: "Light" },
    { value: "dracula", label: "Dracula" },
    { value: "monokai", label: "Monokai" },
    { value: "github-dark", label: "GitHub Dark" },
    { value: "night-owl", label: "Night Owl" },
    { value: "nord", label: "Nord" },
    { value: "solarized-dark", label: "Solarized Dark" },
    { value: "one-dark-pro", label: "One Dark Pro" },
    { value: "cobalt2", label: "Cobalt2" },
  ];

  // --- Session Loading ---
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/sessions/${roomId}`,
        );
        if (response.data && response.data.success !== false) {
          const loadedFiles = response.data.files || [
            { id: 'default', name: 'main.js', code: '// Write your code here', language: 'javascript' }
          ];
          setFiles(loadedFiles);
          filesRef.current = loadedFiles;
          if (loadedFiles.length > 0) {
            setActiveFile(loadedFiles[0].id);
            activeFileRef.current = loadedFiles[0].id;
          }
          toast.success("Session loaded!");
        } else {
          console.log("No existing session found, starting fresh");
        }
      } catch (error) {
        console.log("Error loading session", error);
      }
    };
    loadSession();
  }, [roomId]);

  // --- Cursor Rendering Logic ---
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations = [];

    // Only show cursors for users editing the same file
    Object.entries(remoteCursors).forEach(([socketId, cursorData]) => {
      // Check if this cursor is for the current active file
      if (cursorData.fileId !== activeFile) return;
      
      // Need a valid position
      if (!cursorData.lineNumber || !cursorData.column) return;

      const cursorColor = cursorData.color || "#94A3B8";
      const cursorClass = `remote-cursor-${socketId}`;
      const labelClass = `remote-label-${socketId}`;

      // Inject dynamic CSS for this user's color
      if (!document.getElementById(`style-${socketId}`)) {
        const style = document.createElement("style");
        style.id = `style-${socketId}`;
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
        `;
        document.head.appendChild(style);
      }

      newDecorations.push({
        range: new monaco.Range(
          cursorData.lineNumber,
          cursorData.column,
          cursorData.lineNumber,
          cursorData.column,
        ),
        options: {
          className: cursorClass, // The vertical line
          afterContentClassName: labelClass, // The name tag
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations,
    );

    // Cleanup styles for disconnected users could be done, but minor leak for now.
  }, [remoteCursors, activeFile]);

  // --- Socket Logic ---
  useEffect(() => {
    const handleError = (err) => {
      console.log("socket error:", err);
    };

    if (socketRef.current) return;

    try {
      socketRef.current = initSocket();
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      toast.error("Failed to connect to server: " + error.message);
      return;
    }

    socketRef.current.on("connect_error", handleError);
    socketRef.current.on("connect_failed", handleError);

    socketRef.current.on("connect", () => {
      // console.log("socket connected:", socketRef.current.id);
      // toast.success("Connected to server");

      socketRef.current.emit("request-join", {
        roomId,
        username,
      });
    });

    //Moved outside connect (no duplicate listeners)
    socketRef.current.on("waiting-for-approval", () => {
      toast.info("Waiting for admin approval...");
    });

    socketRef.current.on("join-approved", ({ isAdmin }) => {
      setIsApproved(true);
      toast.success(isAdmin ? "You are the admin" : "Join approved");
      setIsAdmin(isAdmin);
    });
    socketRef.current.on("join-request", ({ username, socketId }) => {
      console.log("JOin request received", username)
      setJoinRequests((prev) => [...prev, { username, socketId }]);
    });

    socketRef.current.on("join-denied", () => {
      toast.error("Admin denied your request");
      navigate("/");
    });

    socketRef.current.on("room-closed", () => {
      toast.error("Admin left. Room closed.");
      navigate("/");
    });
    socketRef.current.on(
      "joined",
      ({ clients, username: joinedUser, socketId }) => {
        if (joinedUser !== username) {
          toast.success(`${joinedUser} joined`);
        }
        setUsers(clients);

        const self = clients.find(
          (client) => client.socketId === socketRef.current.id,
        );
        if (self?.color) {
          selfColorRef.current = self.color;
        }

        if (socketId !== socketRef.current.id) {
          socketRef.current.emit("sync-state", {
            files: filesRef.current,
            activeFile: activeFileRef.current,
            socketId,
          });
        }
      },
    );

    socketRef.current.on("disconnected", ({ clients, username: leftUser }) => {
      toast.info(`${leftUser} left`);
      setUsers(clients);
    });

    socketRef.current.on("file-changed", ({ fileId, code: newCode }) => {
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(f => 
          f.id === fileId ? { ...f, code: newCode } : f
        );
        filesRef.current = updatedFiles;
        return updatedFiles;
      });
      isRemoteUpdate.current = true;
    });

    socketRef.current.on("files-synced", ({ files: syncedFiles, activeFile: syncedActiveFile }) => {
      isRemoteUpdate.current = true;
      setFiles(syncedFiles);
      filesRef.current = syncedFiles;
      if (syncedActiveFile) {
        setActiveFile(syncedActiveFile);
        activeFileRef.current = syncedActiveFile;
      }
    });

    socketRef.current.on("file-created", ({ file: newFile }) => {
      setFiles(prevFiles => {
        const updatedFiles = [...prevFiles, newFile];
        filesRef.current = updatedFiles;
        return updatedFiles;
      });
    });

    socketRef.current.on("file-deleted", ({ fileId }) => {
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.filter(f => f.id !== fileId);
        filesRef.current = updatedFiles;
        // If active file was deleted, switch to first file
        if (activeFileRef.current === fileId && updatedFiles.length > 0) {
          setActiveFile(updatedFiles[0].id);
          activeFileRef.current = updatedFiles[0].id;
        }
        return updatedFiles;
      });
    });

    socketRef.current.on("file-renamed", ({ fileId, newName }) => {
      setFiles(prevFiles => {
        const updatedFiles = prevFiles.map(f =>
          f.id === fileId ? { ...f, name: newName, language: getLanguageFromFilename(newName) } : f
        );
        filesRef.current = updatedFiles;
        return updatedFiles;
      });
    });

    socketRef.current.on("removed-by-admin", () => {
      toast.error("You were removed by the admin.");
      navigate("/");
    });

    socketRef.current.on(
      "chat-message",
      ({ message, username: messageUser, timestamp, color }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${timestamp}-${messageUser}-${Math.random()}`,
            message,
            username: messageUser,
            timestamp,
            color,
          },
        ]);
      },
    );

    socketRef.current.on(
      "cursor-change",
      ({ socketId, cursor, username: cursorUser, color, fileId }) => {
        setRemoteCursors((prev) => ({
          ...prev,
          [socketId]: { ...cursor, username: cursorUser, color, fileId },
        }));
      },
    );

    socketRef.current.on("cursor-removed", ({ socketId }) => {
      setRemoteCursors((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
      const style = document.getElementById(`style-${socketId}`);
      if (style) style.remove();
    });
    setSocketRef(socketRef.current);

    return () => {
      if (socketRef.current?.connected) {
        console.log("disconnecting socket:", socketRef.current.id);
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username, setUsers, navigate]);

  if (!location.state) {
    return <Navigate to="/" state={{ roomId }} />;
  }



  // --- Handlers ---
  
  // File Management Handlers
  const handleFileSelect = (fileId) => {
    setActiveFile(fileId);
    activeFileRef.current = fileId;
  };

  const handleFileCreate = (filename) => {
    if (!isValidFilename(filename)) {
      toast.error('Invalid filename');
      return;
    }

    // Check if file already exists
    if (files.some(f => f.name === filename)) {
      toast.error('File already exists');
      return;
    }

    const fileId = generateFileId();
    const language = getLanguageFromFilename(filename);
    const newFile = {
      id: fileId,
      name: filename,
      code: getDefaultTemplate(language, filename),
      language,
    };

    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    filesRef.current = updatedFiles;
    setActiveFile(fileId);
    activeFileRef.current = fileId;

    socketRef.current?.emit("file-create", {
      roomId,
      file: newFile,
    });

    toast.success(`Created ${filename}`);
  };

  const handleFileDelete = (fileId) => {
    if (files.length === 1) {
      toast.error('Cannot delete the last file');
      return;
    }

    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    filesRef.current = updatedFiles;

    // If active file was deleted, switch to first file
    if (activeFile === fileId) {
      setActiveFile(updatedFiles[0].id);
      activeFileRef.current = updatedFiles[0].id;
    }

    socketRef.current?.emit("file-delete", {
      roomId,
      fileId,
    });
  };

  const handleFileRename = (fileId, newName) => {
    if (!isValidFilename(newName)) {
      toast.error('Invalid filename');
      return;
    }

    // Check if file already exists
    if (files.some(f => f.name === newName && f.id !== fileId)) {
      toast.error('File already exists');
      return;
    }

    const language = getLanguageFromFilename(newName);
    const updatedFiles = files.map(f =>
      f.id === fileId ? { ...f, name: newName, language } : f
    );
    setFiles(updatedFiles);
    filesRef.current = updatedFiles;

    socketRef.current?.emit("file-rename", {
      roomId,
      fileId,
      newName,
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add cursor change listener
    editor.onDidChangeCursorPosition((e) => {
      const { position } = e;
      const cursor = {
        lineNumber: position.lineNumber,
        column: position.column,
      };

      socketRef.current?.emit("cursor-change", {
        roomId,
        cursor,
        username,
        color: selfColorRef.current,
        fileId: activeFile,
      });
    });
  };

  const handleEditorChange = (value) => {
    // If update comes from remote, verify it's not a loop
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const updatedFiles = files.map(f =>
      f.id === activeFile ? { ...f, code: value } : f
    );
    setFiles(updatedFiles);
    filesRef.current = updatedFiles;

    socketRef.current?.emit("file-change", {
      roomId,
      fileId: activeFile,
      code: value,
    });
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleFormat = () => {
    editorRef.current?.getAction("editor.action.formatDocument").run();
  };

  const handleZoomIn = () => {
    editorRef.current?.getAction("editor.action.fontZoomIn").run();
  };

  const handleZoomOut = () => {
    editorRef.current?.getAction("editor.action.fontZoomOut").run();
  };

  const handleZoomReset = () => {
    editorRef.current?.getAction("editor.action.fontZoomReset").run();
  };

  const toggleWordWrap = () => {
    setWordWrap((prev) => (prev === "on" ? "off" : "on"));
  };

  const handleEditorWillMount = (monaco) => {
    // Define custom themes
    monaco.editor.defineTheme("dracula", customThemes.dracula);
    monaco.editor.defineTheme("monokai", customThemes.monokai);
    monaco.editor.defineTheme("github-dark", customThemes["github-dark"]);
    monaco.editor.defineTheme("night-owl", customThemes["night-owl"]);
    monaco.editor.defineTheme("nord", customThemes.nord);
    monaco.editor.defineTheme("solarized-dark", customThemes["solarized-dark"]);
    monaco.editor.defineTheme("one-dark-pro", customThemes["one-dark-pro"]);
    monaco.editor.defineTheme("cobalt2", customThemes.cobalt2);
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    const timestamp = Date.now();

    socketRef.current?.emit("chat-message", {
      roomId,
      message: chatInput.trim(),
      username,
      timestamp,
      color: selfColorRef.current,
    });

    setChatInput("");
  };
  if (!isApproved) {
    return (
      <div className="h-full w-full flex items-center justify-center text-white">
        Waiting for admin approval...
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 text-sm text-white">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">Current File:</span>
          <span className="font-medium text-white">{currentFile?.name}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 text-xs">{language}</span>
          <span className="text-zinc-300 ml-4">Theme:</span>
          <div className="w-48">
            <Select
              options={themeOptions}
              value={theme}
              onChange={handleThemeChange}
              placeholder="Select Theme"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700">
          <button
            onClick={toggleWordWrap}
            className={`p-1.5 rounded-md transition-colors ${wordWrap === "on" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-700"}`}
            title="Toggle Word Wrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <div className="w-px h-4 bg-zinc-700 mx-1"></div>
          <button
            onClick={handleFormat}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
            title="Format Code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          <div className="w-px h-4 bg-zinc-700 mx-1"></div>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors text-xs font-semibold"
            title="Reset Zoom"
          >
            100%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <FileExplorer
          files={files}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
          onFileDelete={handleFileDelete}
          onFileRename={handleFileRename}
        />
        
        <div className="flex-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme}
            beforeMount={handleEditorWillMount}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: wordWrap,
              automaticLayout: true,
              padding: { top: 20, bottom: 20 },
            }}
          />
        </div>

        <div className="w-80 flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 text-white">
          <div className="px-3 py-2 border-b border-zinc-700 text-sm font-semibold">
            Team Chat
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-zinc-500">
                Start chatting with your team.
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.username === username ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: msg.color || "#94A3B8" }}
                  />
                  <span>{msg.username}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${msg.username === username ? "bg-indigo-600" : "bg-zinc-800"}`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-zinc-700"
          >
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
  );
};

export default CodeEditor;

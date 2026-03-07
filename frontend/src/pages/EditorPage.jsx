import React, { useState, useEffect } from "react";
import editorimg from "../assets/editor.svg";
import User from "../components/User";
import CodeEditor from "../components/Editor";
import CodeMirrorEditor from "../components/CodeMirrorEditor";
import SessionManager from "../components/SessionManager";
import AuthModal from "../components/AuthModal";
import VoiceChat from "../components/VoiceChat";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

const EditorPage = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [socketRef, setSocketRef] = useState(null);
  const [speakingUsers, setSpeakingUsers] = useState({}); // { socketId: boolean }

  const [joinRequests, setJoinRequests] = useState([]);

  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!socketRef) return;

    const handleSpeakingStatus = ({ socketId, isSpeaking }) => {
      setSpeakingUsers((prev) => ({ ...prev, [socketId]: isSpeaking }));
    };

    socketRef.on("voice-speaking-status", handleSpeakingStatus);

    return () => {
      socketRef.off("voice-speaking-status", handleSpeakingStatus);
    };
  }, [socketRef]);

  const handleCopyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    toast.success(`Room id copied`);
  };

  const handleShareLink = async () => {
    const link = `${window.location.origin}/editorpage/${roomId}`;
    await navigator.clipboard.writeText(link);
    toast.success("Share link copied!");
  };
  const kickUser = (socketId) => {
    if (!socketRef) return;

    if (window.confirm("Are you sure you want to remove this user?")) {
      socketRef.emit("remove-user", {
        roomId,
        socketId,
      });
    }
  };

  const handleLeave = () => {
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      {isAdmin && joinRequests.length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 w-72">
          <h3 className="text-white font-semibold mb-3">Join Requests</h3>

          {joinRequests.map((req) => (
            <div
              key={req.socketId}
              className="flex items-center justify-between mb-2 text-sm"
            >
              <span className="text-zinc-300">{req.username}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    socketRef.emit("approve-user", {
                      roomId,
                      socketId: req.socketId,

                    });

                    setJoinRequests((prev) =>
                      prev.filter((r) => r.socketId !== req.socketId),
                    );
                  }} className="bg-lime-500 rounded-md p-2 font-bold"
                >
                  Allow
                </button>

                <button
                  onClick={() => {
                    socketRef.emit("deny-user", {
                      roomId,
                      socketId: req.socketId,
                    });

                    setJoinRequests((prev) =>
                      prev.filter((r) => r.socketId !== req.socketId),
                    );
                  }}
                  className="bg-red-500 rounded-md p-2 font-bold"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* //left bar */}
      <div className="bg-linear-to-b from-zinc-900 to-zinc-950 w-80 p-6 flex flex-col h-screen border-r border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3 text-white w-fit mb-6">
            <img
              src={editorimg}
              alt="editor"
              className="w-12 h-12 object-contain"
            />

            <h2 className="text-2xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              CodeFusion
            </h2>
          </div>

          <hr className="border-zinc-800 w-full mb-6" />

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-zinc-300">
                Connected Users
              </span>
              <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2 py-1 rounded-full">
                {users.length}
              </span>
            </div>

            <div className="usersinfo flex flex-wrap gap-4">
              {users.map((user) => (
                <User
                  username={user.username}
                  color={user.color}
                  socketId={user.socketId}
                  mySocketId={socketRef?.id}
                  isAdmin={isAdmin}
                  onKick={kickUser}
                  isSpeaking={speakingUsers[user.socketId]}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          {!user && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-zinc-700 hover:border-indigo-500 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-zinc-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign In
            </button>
          )}

          <button
            onClick={handleShareLink}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share Session
          </button>

          <button
            onClick={() => setShowSessionManager(true)}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-purple-500/20"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save Session
          </button>

          <button
            onClick={handleCopyRoomId}
            className="w-full flex items-center justify-center gap-2 border-2 border-zinc-700 hover:border-indigo-500 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-zinc-800"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Room ID
          </button>
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 border-2 border-red-500/50 hover:bg-red-500 text-red-400 hover:text-white py-3 rounded-xl font-semibold transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Leave Room
          </button>
        </div>
      </div>

      {/* right editor */}
      <div className="bg-zinc-900 flex-1 p-6 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            setUsers={setUsers}
            setIsAdmin={setIsAdmin}
            setSocketRef={setSocketRef}
            setJoinRequests={setJoinRequests}
          />

          {/* or <CodeMirrorEditor /> */}
        </div>
      </div>

      {showSessionManager && (
        <SessionManager
          roomId={roomId}
          onClose={() => setShowSessionManager(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {socketRef && (
        <VoiceChat
          roomId={roomId}
          socket={socketRef}
          username={user?.username || "Guest"}
          users={users}
        />
      )}
    </div>
  );
};

export default EditorPage;

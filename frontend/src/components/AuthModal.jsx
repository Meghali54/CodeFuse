import React, { useState } from "react";
import Modal from "./Modal";
import axios from "axios";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";

const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'signup'

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === "signup" && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const endpoint =
        activeTab === "login"
          ? `${import.meta.env.VITE_BACKEND_URL}/api/users/login`
          : `${import.meta.env.VITE_BACKEND_URL}/api/users/register`;

      const payload =
        activeTab === "login"
          ? { email, password }
          : { username, email, password };

      console.log(payload);
      const response = await axios.post(endpoint, payload);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success(`Welcome, ${response.data.user.username}!`);
        onClose();
        window.location.reload(); // Simple way to update UI state
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error.response?.data?.message || "Authentication failed");
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirmPassword("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === "login" ? "Welcome Back" : "Create Account"}
    >
      {/* Tabs */}
      <div className="flex p-1 bg-zinc-800/50 rounded-xl mb-6">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "login"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
            }`}
          onClick={() => switchTab("login")}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "signup"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-zinc-400 hover:text-white"
            }`}
          onClick={() => switchTab("signup")}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "signup" && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {activeTab === "signup" && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6"
        >
          {activeTab === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="relative flex items-center py-4">
          <div className="grow border-t border-zinc-700"></div>
          <span className="shrink-0 mx-4 text-zinc-400 text-sm">or</span>
          <div className="grow border-t border-zinc-700"></div>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/oauth/google`;
          }}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl border border-zinc-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/oauth/github`;
          }}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl border border-zinc-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
          </svg>
          Continue with Github
        </button>
      </form>
    </Modal>
  );
};

export default AuthModal;

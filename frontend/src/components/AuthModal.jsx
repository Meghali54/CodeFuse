import React, { useState } from 'react';
import Modal from './Modal';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from "lucide-react";

const AuthModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (activeTab === 'signup' && password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const endpoint = activeTab === 'login'
                ? `${import.meta.env.VITE_BACKEND_URL}/api/users/login`
                : `${import.meta.env.VITE_BACKEND_URL}/api/users/register`;

            const payload = activeTab === 'login'
                ? { email, password }
                : { username, email, password };

            console.log(payload);
            const response = await axios.post(endpoint, payload);


            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
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
        setEmail('');
        setPassword('');
        setUsername('');
        setConfirmPassword('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
        >
            {/* Tabs */}
            <div className="flex p-1 bg-zinc-800/50 rounded-xl mb-6">
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'login'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    onClick={() => switchTab('login')}
                >
                    Login
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'signup'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    onClick={() => switchTab('signup')}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'signup' && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Username</label>
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
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
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

                {activeTab === 'signup' && (
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
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6"
                >
                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
            </form>
        </Modal>
    );
};

export default AuthModal;

import React, { useState } from 'react';
import Modal from './Modal';

const AuthModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitted:', { activeTab, email, password, username });
        // TODO: Implement backend integration
        onClose();
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        // Reset fields usually, keeping simple for now
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
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {activeTab === 'signup' && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
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

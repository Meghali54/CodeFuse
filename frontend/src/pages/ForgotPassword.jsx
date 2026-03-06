import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import editorImg from "../assets/editor.svg";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/forgot-password`, { email });
            if (response.data.success) {
                toast.success('OTP sent to your email');
                navigate('/reset-password', { state: { email } });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-indigo-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <img src={editorImg} alt="logo" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-bold text-white">CodeFusion</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
                    <p className="text-zinc-400">Enter your email to receive an OTP</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-800 text-white py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                            }`}
                    >
                        {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

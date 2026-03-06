import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import editorImg from "../assets/editor.svg";

const ResetPassword = () => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            toast.error('Session expired. Please request a new OTP.');
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/users/reset-password`, {
                email,
                otp,
                newPassword
            });

            if (response.data.success) {
                toast.success('Password reset successfully! You can now log in.');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
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
                    <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-zinc-400">Enter the OTP sent to {email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-zinc-800 text-white py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-widest text-center text-lg"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-zinc-800 text-white py-3 px-4 pr-12 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-zinc-800 text-white py-3 px-4 pr-12 rounded-xl border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !otp || !newPassword || !confirmPassword}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 mt-2 ${isLoading || !otp || !newPassword || !confirmPassword ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                            }`}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;

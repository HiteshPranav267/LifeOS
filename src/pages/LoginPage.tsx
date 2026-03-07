import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Mail,
    Lock,
    ArrowLeft,
    Layers
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { useStore } from '../store/StoreContext.tsx';
import { useEffect } from 'react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    useEffect(() => {
        if (session) {
            navigate('/app');
        }
    }, [session, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (mode === 'signup') {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });
            if (signUpError) {
                setError(signUpError.message);
                setIsLoading(false);
                return;
            }
            if (data?.user?.identities?.length === 0) {
                setError('An account with this email already exists. Try signing in.');
                setIsLoading(false);
                return;
            }
            // Auto sign-in after signup (no email verification needed)
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                setError(signInError.message);
                setIsLoading(false);
                return;
            }
            navigate('/app');
            setIsLoading(false);
            return;
        }

        // Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message === 'Invalid login credentials') {
                setError('Invalid email or password.');
            } else {
                setError(error.message);
            }
            setIsLoading(false);
            return;
        }

        navigate('/app');
        setIsLoading(false);
    };

    const handleGoogleAuth = async () => {
        const isNative = Capacitor.isNativePlatform();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: isNative
                    ? 'com.hitesh.lifeos://login'
                    : `${window.location.origin}/app`
            }
        });
        if (error) setError(error.message);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-12" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div className="w-full max-w-[400px] flex flex-col gap-8">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                        <Layers size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-semibold tracking-tight lowercase">lifeos.</span>
                    <p className="text-neutral-500 text-sm">Your private productivity hub</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5">
                    <button
                        onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                    >
                        Create Account
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 h-14 bg-white/5 border border-white/10 rounded-2xl placeholder:text-neutral-600 focus:border-white/20 outline-none transition-all text-sm text-white !mb-0"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="password"
                            placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 h-14 bg-white/5 border border-white/10 rounded-2xl placeholder:text-neutral-600 focus:border-white/20 outline-none transition-all text-sm text-white !mb-0"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                            <p className="text-green-400 text-sm">{success}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 h-14 bg-white text-black rounded-2xl font-semibold hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ChevronRight size={18} /></>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative flex items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="px-4 text-xs text-neutral-600 font-medium">or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* Google */}
                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-3 h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-medium hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg>
                    Continue with Google
                </button>

                <p className="text-center text-xs text-neutral-600">
                    {mode === 'signin'
                        ? "Don't have an account? Switch to Create Account above."
                        : 'Your account will be created and you\'ll be signed in automatically.'}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // In a real app, handle JWT here
        localStorage.setItem('token', 'mock-jwt-token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 premium-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 ring-4 ring-primary/10">
                        <Zap className="text-white w-10 h-10 fill-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to your AutoJobAgent account</p>
                </div>

                <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl space-y-8 glassmorphism">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
                                <Link to="/forgot-password" title='Coming Soon' className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full premium-gradient text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                        >
                            Sign In
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-tighter">
                            <span className="bg-card px-4 text-muted-foreground font-medium">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors font-medium">
                            <Chrome className="h-5 w-5" />
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors font-medium">
                            <Github className="h-5 w-5" />
                            GitHub
                        </button>
                    </div>
                </div>

                <p className="text-center mt-10 text-sm text-muted-foreground font-medium">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary hover:underline font-bold">Sign up for free</Link>
                </p>
            </motion.div>
        </div>
    );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleSignup = (e) => {
        e.preventDefault();
        localStorage.setItem('token', 'mock-jwt-token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 premium-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-6 ring-4 ring-primary/10">
                        <Zap className="text-white w-10 h-10 fill-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Create Account</h1>
                    <p className="text-muted-foreground w-80 mx-auto">Join the future of AI-powered job automation and landing your dream role.</p>
                </div>

                <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl space-y-8 glassmorphism">
                    <form className="space-y-6" onSubmit={handleSignup}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@example.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Create Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3.5 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <div className="w-5 h-5 border border-border bg-accent rounded flex items-center justify-center cursor-pointer">
                                <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight">By signing up, I agree to the <span className="text-primary font-bold">Terms of Service</span> and <span className="text-primary font-bold">Privacy Policy</span>.</p>
                        </div>

                        <button
                            type="submit"
                            className="w-full premium-gradient text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                        >
                            Get Started Now
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                        Enterprise-grade data encryption
                    </div>
                </div>

                <p className="text-center mt-10 text-sm text-muted-foreground font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-bold">Log in instead</Link>
                </p>
            </motion.div>
        </div>
    );
}

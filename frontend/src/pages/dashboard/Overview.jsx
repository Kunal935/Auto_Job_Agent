import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Send,
    Target,
    AlertCircle,
    TrendingUp,
    Clock,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { jobApi } from '../../api';

export default function Overview() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await jobApi.getMatches();
                setMatches(res.data.jobs || []);
            } catch (err) {
                console.error("Failed to fetch overview stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Jobs Found', value: matches.length.toString(), icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Applications Sent', value: '38', icon: Send, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Match Accuracy', value: matches.length > 0 ? `${Math.round(matches.reduce((acc, curr) => acc + (curr.match || 0), 0) / matches.length)}%` : '0%', icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Missing Skills', value: '12', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your job search.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                                <TrendingUp className="h-3 w-3" />
                                +12%
                            </span>
                        </div>
                        <h3 className="text-muted-foreground text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-foreground">Recent Job Matches</h3>
                        <button className="text-sm text-primary hover:underline">View all</button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center">
                                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2"></div>
                                <span className="text-xs text-muted-foreground italic">Fetching latest...</span>
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                                No matches found yet.
                            </div>
                        ) : matches.slice(0, 3).map((job, i) => (
                            <div key={job?.id || i} className="flex items-center justify-between p-4 bg-accent/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-border overflow-hidden">
                                        {job?.logo ? <img src={job.logo} alt="" className="w-full h-full object-cover" /> : <Briefcase className="w-6 h-6 text-muted-foreground" />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground">{job?.title || 'Job Opening'}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{job?.company || 'Company'} • {job?.location || 'Remote'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 ${(job?.match || 0) > 75 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} text-xs font-bold rounded-full border`}>
                                        {job?.match || 0}% Match
                                    </div>
                                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Upcoming Interviews</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="flex flex-col items-center justify-center p-2 bg-primary/20 rounded-lg min-w-[50px] h-[50px]">
                                <span className="text-primary font-bold text-lg leading-none">24</span>
                                <span className="text-primary text-[10px] uppercase font-bold">Feb</span>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Technical Round</h4>
                                <p className="text-xs text-muted-foreground mt-1">Meta • 10:00 AM PST</p>
                                <div className="mt-2 flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full border-2 border-card bg-blue-500 flex items-center justify-center text-[10px] font-bold">JD</div>
                                    <div className="w-6 h-6 rounded-full border-2 border-card bg-purple-500 flex items-center justify-center text-[10px] font-bold">AS</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Job Search Progress</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Applications Goal</span>
                                <span className="text-foreground font-medium">38/50</span>
                            </div>
                            <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '76%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

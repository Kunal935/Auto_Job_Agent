import React, { useState, useEffect } from 'react';
import {
    Search,
    SlidersHorizontal,
    MapPin,
    Briefcase,
    CircleDollarSign,
    ChevronDown,
    Sparkles,
    ExternalLink,
    ChevronRight,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi } from '../../api';
import { useResume } from '../../context/ResumeContext';

export default function JobMatches() {
    const { resumeData } = useResume();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewCount, setViewCount] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detailedInsight, setDetailedInsight] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async (query = searchQuery) => {
        setLoading(true);
        try {
            const response = await jobApi.getMatches(query);
            setJobs(response.data.jobs || []);
            console.log("Fetched matches:", response.data);
        } catch (err) {
            setError(err.message || "Failed to fetch job matches.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchMatches(searchQuery);
        }
    };

    const handleViewJob = async (job) => {
        setSelectedJob(job);
        setIsModalOpen(true);
        setViewCount(prev => prev + 1);
        setIsAnalyzing(true);
        setDetailedInsight(null);

        try {
            // Use real resume ID from context or default to '1'
            const resumeId = resumeData?.id || '1';
            const response = await jobApi.getDetailedInsight(resumeId, job.description || job.title);
            setDetailedInsight(response.data);
        } catch (err) {
            console.error("Analysis error:", err);
            setDetailedInsight({
                insight: "Error during AI analysis. Please try again.",
                missing_skills: [],
                red_flags: ["Analysis service unreachable"]
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getMatchColor = (score) => {
        if (score >= 75) return 'text-green-400';
        if (score >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getMatchBg = (score) => {
        if (score >= 75) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">AI Match Engine</h1>
                    <p className="text-slate-400 text-lg">Smart job discovery optimized for your unique profile.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-3 flex items-center gap-3 backdrop-blur-xl shadow-inner">
                        <span className="text-xs text-slate-500 uppercase font-black tracking-widest">Premium Queries</span>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <span className="text-sm font-black text-primary">{Math.max(0, 5 - viewCount)} / 5</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md">
                <div className="relative md:col-span-8 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by role, company, or tech stack (Press Enter)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full pl-12 pr-6 py-4 bg-transparent text-white placeholder-slate-600 focus:outline-none focus:ring-0 text-md"
                    />
                </div>
                <div className="md:col-span-2 border-l border-slate-800 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all rounded-xl">
                    <span className="text-sm text-slate-400 font-medium">Remote</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                </div>
                <div className="md:col-span-2 border-l border-slate-800 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all rounded-xl" onClick={() => fetchMatches()}>
                    <span className="text-sm text-primary font-bold">Refresh</span>
                    <RefreshCw className={`h-4 w-4 text-primary ${loading ? 'animate-spin' : ''}`} />
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-900/20 border border-slate-800 rounded-3xl backdrop-blur-sm">
                        <div className="relative h-20 w-20">
                            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-400 mt-8 font-medium animate-pulse">Scanning global job markets for your fit...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 bg-red-500/5 border border-red-500/10 rounded-3xl text-center backdrop-blur-sm">
                        <AlertTriangle className="h-14 w-14 text-red-500/50 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Network Sync Interrupted</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">{error}</p>
                        <button
                            onClick={() => fetchMatches()}
                            className="px-10 py-4 premium-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            Reconnect Now
                        </button>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                        <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Briefcase className="h-10 w-10 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Matches Found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your search criteria or uploading a more detailed resume.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {jobs.map((job, index) => (
                            <motion.div
                                key={job.id || index}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08, duration: 0.5 }}
                                className="group relative bg-slate-900/40 border border-slate-800 hover:border-primary/50 rounded-3xl p-8 hover:bg-slate-900/60 transition-all cursor-pointer shadow-xl hover:shadow-primary/5 overflow-hidden"
                                onClick={() => handleViewJob(job)}
                            >
                                {/* Futuristic Match Indicator */}
                                <div className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-700 opacity-30`}></div>
                                
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                    <div className="flex items-start gap-8">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors overflow-hidden shadow-2xl shadow-black/40">
                                            {job.logo ? (
                                                <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-black text-3xl text-slate-500">{job.company?.[0]?.toUpperCase() || 'J'}</span>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">{job.title}</h3>
                                                <span className="px-3 py-1 bg-slate-800/50 rounded-lg text-[10px] uppercase font-black text-slate-500 border border-slate-700/50">{job.source}</span>
                                            </div>
                                            <p className="text-slate-300 text-lg font-bold">{job.company}</p>
                                            <div className="flex flex-wrap items-center gap-6 mt-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold bg-slate-800/30 px-3 py-1.5 rounded-xl border border-slate-700/30">
                                                    <MapPin className="h-4 w-4 text-primary/70" />
                                                    {job.location || 'Remote'}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold bg-slate-800/30 px-3 py-1.5 rounded-xl border border-slate-700/30">
                                                    <Briefcase className="h-4 w-4 text-primary/70" />
                                                    {job.experience || 'Entry'}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold bg-slate-800/30 px-3 py-1.5 rounded-xl border border-slate-700/30">
                                                    <CircleDollarSign className="h-4 w-4 text-primary/70" />
                                                    {job.salary || 'Market Rate'}
                                                </div>
                                                <div className="text-sm text-slate-500 font-medium italic">{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Active Now'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center lg:items-end gap-4 min-w-[140px]">
                                        <div className="relative h-24 w-24">
                                            <svg className="h-full w-full" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                                                <circle 
                                                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                                                    strokeDasharray={2 * Math.PI * 45} 
                                                    strokeDashoffset={2 * Math.PI * 45 * (1 - (job.match || 0) / 100)} 
                                                    className={`${getMatchColor(job.match)} transition-all duration-1000 ease-out`}
                                                    transform="rotate(-90 50 50)"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                                <span className={`text-2xl font-black ${getMatchColor(job.match)}`}>{job.match}%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap justify-center lg:justify-end gap-2">
                                            {(job.tags || []).slice(0, 3).map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-primary/10 rounded-full text-[10px] uppercase font-black text-primary border border-primary/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 text-sm bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 w-full sm:w-auto">
                                        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="text-slate-200 font-medium line-clamp-1 italic">
                                            {job.ai_insight || "Analyzing match potential..."}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-tighter group-hover:translate-x-2 transition-transform">
                                        View Deep Analysis <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal - Rebuilt for Premium Feel */}
            <AnimatePresence>
                {isModalOpen && selectedJob && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50, rotateX: 10 }}
                            className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] flex flex-col max-h-[95vh] overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 premium-gradient opacity-60"></div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-10">
                                    <div className="flex items-start justify-between mb-12">
                                        <div className="flex gap-8">
                                            <div className="w-24 h-24 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-2xl">
                                                <span className="font-black text-4xl text-slate-500">{selectedJob?.company?.[0]?.toUpperCase() || 'J'}</span>
                                            </div>
                                            <div>
                                                <h2 className="text-4xl font-black text-white mb-2">{selectedJob?.title}</h2>
                                                <p className="text-2xl text-slate-400 font-bold">{selectedJob?.company}</p>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <span className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase tracking-widest"><MapPin className="h-4 w-4" /> {selectedJob?.location}</span>
                                                    <span className="flex items-center gap-2 text-slate-500 font-black text-xs uppercase tracking-widest"><CircleDollarSign className="h-4 w-4" /> {selectedJob?.salary}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl text-slate-400 transition-all border border-slate-700">
                                            <X className="h-7 w-7" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-10">
                                            <section className="relative overflow-hidden bg-slate-800/30 border border-slate-800 rounded-3xl p-10">
                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                    <Sparkles className="h-32 w-32 text-primary" />
                                                </div>
                                                <h4 className="flex items-center gap-3 text-primary font-black text-sm uppercase tracking-widest mb-6">
                                                    <Sparkles className="h-5 w-5" />
                                                    AI Performance Forecast
                                                </h4>
                                                {isAnalyzing ? (
                                                    <div className="space-y-6 py-4">
                                                        <div className="h-4 bg-slate-800 rounded-full w-full animate-pulse"></div>
                                                        <div className="h-4 bg-slate-800 rounded-full w-5/6 animate-pulse"></div>
                                                        <div className="h-4 bg-slate-800 rounded-full w-4/6 animate-pulse"></div>
                                                        <div className="flex items-center gap-3 text-sm text-primary font-bold animate-bounce mt-8">
                                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                                            Processing neural match analysis...
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-slate-200 text-xl leading-relaxed font-medium">
                                                            {detailedInsight?.insight || selectedJob?.ai_insight || "Detailed comparison currently in progress..."}
                                                        </p>
                                                        
                                                        {detailedInsight?.strengths?.length > 0 && (
                                                            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                {detailedInsight.strengths.map((strength, i) => (
                                                                    <div key={i} className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl">
                                                                        <div className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Key Strength</div>
                                                                        <div className="text-white text-sm font-bold">{strength}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </section>

                                            <section className="p-4">
                                                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Job Summary</h4>
                                                <div className="prose prose-invert max-w-none">
                                                    <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">
                                                        {selectedJob?.description || "No full description provided by source. Check the application link for more details."}
                                                    </p>
                                                </div>
                                            </section>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="bg-slate-800/20 border border-slate-800 rounded-3xl p-8">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Role Architecture</h4>
                                                <div className="space-y-10">
                                                    <div>
                                                        <div className="text-xs font-bold text-amber-500/70 mb-4 uppercase flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Skill Gaps
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {detailedInsight?.missing_skills?.length > 0 ? detailedInsight.missing_skills.map((skill, idx) => (
                                                                <span key={idx} className="px-4 py-2 bg-amber-500/5 text-amber-500 text-xs font-black rounded-xl border border-amber-500/20">
                                                                    {typeof skill === 'object' ? (skill.skill || skill.name) : skill}
                                                                </span>
                                                            )) : <span className="text-sm text-green-400 font-black bg-green-500/10 px-4 py-2 rounded-xl">0 GAPS DETECTED</span>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-xs font-bold text-red-500/70 mb-4 uppercase flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Risky Profiles
                                                        </div>
                                                        <div className="space-y-4">
                                                            {detailedInsight?.red_flags?.length > 0 ? detailedInsight.red_flags.map((flag, i) => (
                                                                <div key={i} className="flex gap-3 text-red-500/80 text-sm font-bold bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                                                                    <AlertTriangle className="h-5 w-5 min-w-[20px]" />
                                                                    {typeof flag === 'object' ? (flag.issue || flag.reason) : flag}
                                                                </div>
                                                            )) : (
                                                                <div className="flex gap-3 text-green-400 text-sm font-black bg-green-500/5 p-4 rounded-2xl border border-green-500/10">
                                                                    <ShieldCheck className="h-5 w-5" /> NO RED FLAGS
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8">
                                                <div className="text-center">
                                                    <div className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Final Match Rating</div>
                                                    <div className="text-7xl font-black text-white mb-2">{selectedJob?.match || 0}<span className="text-3xl text-primary">%</span></div>
                                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-6">
                                                        <div 
                                                            className="h-full premium-gradient transition-all duration-1000" 
                                                            style={{ width: `${selectedJob?.match || 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-3xl flex gap-6">
                                <a 
                                    href={selectedJob?.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 premium-gradient text-white text-center font-black py-6 rounded-3xl shadow-3xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] active:scale-95 transition-all text-sm uppercase tracking-widest"
                                    onClick={() => setViewCount(prev => prev + 1)}
                                >
                                    Launch Application Pipeline
                                </a>
                                <button className="px-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-3xl font-black transition-all hover:scale-110" title="Save for later">
                                    <ExternalLink className="h-6 w-6 text-slate-300" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

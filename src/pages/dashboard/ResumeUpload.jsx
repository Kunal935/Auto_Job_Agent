import React, { useState, useEffect } from 'react';
import {
    Upload,
    File,
    CheckCircle,
    AlertCircle,
    X,
    ShieldCheck,
    Sparkles,
    Cpu,
    Search,
    Database,
    Zap,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi } from '../../api';
import { Link } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';

const STAGES = [
    { id: 1, label: "Reading your resume...", icon: Search, color: "text-blue-500", detail: "Scanning document architecture" },
    { id: 2, label: "Extracting skills and experience...", icon: Cpu, color: "text-purple-500", detail: "Executing deep entity recognition" },
    { id: 3, label: "Analyzing career strengths...", icon: Sparkles, color: "text-amber-500", detail: "Mapping expertise to industry standards" },
    { id: 4, label: "Structuring professional profile...", icon: Database, color: "text-green-500", detail: "Finalizing AI-powered insights" }
];

export default function ResumeUpload() {
    const {
        resumeData, setResumeData,
        resumeFile: file, setResumeFile: setFile,
        isAnalyzing: uploading, setIsAnalyzing: setUploading,
        analysisProgress: progress, setAnalysisProgress: setProgress,
        analysisStage: currentStage, setAnalysisStage: setCurrentStage
    } = useResume();

    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);

    // Persist results if data exists
    useEffect(() => {
        if (resumeData && !uploading) {
            setShowResults(true);
        }
    }, [resumeData, uploading]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFile = async (selectedFile) => {
        const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (validTypes.includes(selectedFile.type)) {
            setFile(selectedFile);
            setError(null);
            setShowResults(false);
            await uploadFile(selectedFile);
        } else {
            setError("Please upload a PDF or DOCX file.");
        }
    };

    const uploadFile = async (selectedFile) => {
        setUploading(true);
        setProgress(0);
        setCurrentStage(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const next = prev + (Math.random() * 2);
                if (next < 25) setCurrentStage(0);
                else if (next < 50) setCurrentStage(1);
                else if (next < 75) setCurrentStage(2);
                else if (next < 95) setCurrentStage(3);
                return next > 95 ? 95 : next;
            });
        }, 400);

        try {
            const response = await jobApi.uploadResume(selectedFile);
            clearInterval(progressInterval);
            setProgress(100);

            // Wait a moment for the 100% to reflect
            setTimeout(() => {
                const extraction = response.data?.data || {};
                const resumeId = response.data?.resume_id;
                
                // Merge ID into the data object for context portability
                setResumeData({ ...extraction, id: resumeId });
                setUploading(false);
                setShowResults(true);
            }, 800);
        } catch (err) {
            clearInterval(progressInterval);
            setError(err.message || "Failed to analyze resume. Please check your connection.");
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AI Resume Intelligence</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Our advanced neural engine extracts core competencies and maps your career path.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <AnimatePresence mode="wait">
                        {!file && !uploading && (
                            <motion.div
                                key="upload-zone"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative h-[400px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all bg-card/30 backdrop-blur-xl ${dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className="w-24 h-24 premium-gradient rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse">
                                    <Upload className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold">Deploy your resume</h3>
                                <p className="text-muted-foreground mt-2">Drag & drop your PDF or DOCX here</p>
                                <div className="mt-8 flex gap-4 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Secure</span>
                                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Real-time</span>
                                    <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Neural Parsing</span>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                />
                            </motion.div>
                        )}

                        {uploading && (
                            <motion.div
                                key="loading-zone"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-[500px] bg-card/40 border border-white/10 rounded-[3rem] backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden shadow-2xl"
                            >
                                {/* Animated Background Pulse */}
                                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-blob" />
                                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />

                                <div className="z-10 w-full max-w-md space-y-12">
                                    <div className="relative mx-auto w-32 h-32">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                        <div className="relative z-10 w-full h-full bg-card border border-primary/30 rounded-full flex items-center justify-center shadow-inner">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={currentStage}
                                                    initial={{ rotate: -90, opacity: 0 }}
                                                    animate={{ rotate: 0, opacity: 1 }}
                                                    exit={{ rotate: 90, opacity: 0 }}
                                                >
                                                    {React.createElement(STAGES[currentStage]?.icon || Search, { className: `h-10 w-10 ${STAGES[currentStage]?.color || "text-primary"}` })}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <motion.h3
                                            key={STAGES[currentStage]?.label}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="text-2xl font-bold tracking-tight"
                                        >
                                            {STAGES[currentStage]?.label}
                                        </motion.h3>
                                        <p className="text-muted-foreground text-sm font-medium h-4">
                                            {STAGES[currentStage]?.detail}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                className="h-full premium-gradient"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <span>Neural Processing</span>
                                            <span>{Math.round(progress)}% Complete</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {showResults && resumeData && (
                            <motion.div
                                key="results-zone"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                {/* Header Summary */}
                                <div className="bg-card/50 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center"
                                        >
                                            <CheckCircle className="h-8 w-8 text-green-500" />
                                        </motion.div>
                                    </div>

                                    <div className="relative z-10 flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 rounded-[1.5rem] premium-gradient p-0.5 shadow-xl">
                                            <div className="w-full h-full bg-card rounded-[1.4rem] flex items-center justify-center">
                                                <span className="text-3xl font-black">{resumeData.name?.[0] || "U"}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <motion.h2
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-3xl font-bold truncate"
                                            >
                                                {resumeData.name || "Unknown Professional"}
                                            </motion.h2>
                                            <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1 truncate">
                                                {resumeData.email} {resumeData.phone && `• ${resumeData.phone}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="space-y-4"
                                        >
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Experience Profile</label>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-primary/20 transition-colors">
                                                <p className="text-sm leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap">
                                                    {Array.isArray(resumeData.experience)
                                                        ? resumeData.experience.map(item => typeof item === 'object' ? (item.title || item.role) : item).join(", ")
                                                        : resumeData.experience || "Analysis pending."}
                                                </p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="space-y-4"
                                        >
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Education Path</label>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-primary/20 transition-colors">
                                                <p className="text-sm font-medium">
                                                    {Array.isArray(resumeData.education)
                                                        ? resumeData.education.map(item => typeof item === 'object' ? (item.degree || item.school) : item).join(", ")
                                                        : resumeData.education || "Analysis pending."}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-8 space-y-4"
                                    >
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Skill Matrix</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(resumeData.skills) ? resumeData.skills.map((skill, idx) => (
                                                <motion.span
                                                    key={idx}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 0.5 + (idx * 0.05) }}
                                                    className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary shadow-sm"
                                                >
                                                    {typeof skill === 'object' ? (skill.name || skill.skill) : skill}
                                                </motion.span>
                                            )) : <span className="text-sm italic text-muted-foreground">Identifying skillset...</span>}
                                        </div>
                                    </motion.div>

                                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <button
                                            onClick={() => { setFile(null); setResumeData(null); setShowResults(false); }}
                                            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border text-sm font-bold hover:bg-accent transition-colors"
                                        >
                                            Reset Profile
                                        </button>
                                        <Link to="/matches" className="w-full sm:flex-1">
                                            <button className="w-full premium-gradient text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                                Discover Relevant Careers <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-6 shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-500">System Anomaly Detected</h4>
                                <p className="text-sm text-red-500/80 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => { setError(null); setUploading(false); setFile(null); }}
                                className="ml-auto p-2 hover:bg-red-500/10 rounded-full text-red-500"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* Information Sidebar */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden"
                    >
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                        <h4 className="text-lg font-bold flex items-center gap-2 mb-6 text-primary">
                            <Sparkles className="h-5 w-5" />
                            AI Insight
                        </h4>
                        <div className="space-y-6">
                            <div className="p-4 bg-card/50 rounded-[1.5rem] border border-white/5">
                                <p className="text-sm font-bold mb-1">Impact Analysis</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">Resumes with strong action verbs and quantified metrics see a 40% higher engagement rate.</p>
                            </div>
                            <div className="p-4 bg-card/50 rounded-[1.5rem] border border-white/5">
                                <p className="text-sm font-bold mb-1">ATS Compatibility</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">Our AI ensures your data is structured for modern recruitment algorithms.</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm"
                    >
                        <h4 className="font-bold mb-6 flex items-center justify-between">
                            Neural History
                            <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-muted-foreground">NEW</span>
                        </h4>
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center gap-4 p-3 hover:bg-accent/50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-border group">
                                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <File className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h5 className="text-sm font-bold truncate">senior_software_engineer.pdf</h5>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Analyzed</span>
                                            <span className="text-[10px] text-primary font-bold">92% Match</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function RefreshCw({ className }) {
    return <motion.svg
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
    </motion.svg>;
}

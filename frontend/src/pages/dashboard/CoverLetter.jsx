import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Sparkles,
    Copy,
    Download,
    RefreshCw,
    Eye,
    Type,
    Check,
    AlertTriangle,
    ShieldCheck,
    Lock,
    ChevronDown,
    PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobApi } from '../../api';
import { useResume } from '../../context/ResumeContext';

const JOB_ROLES = {
    "Software": [
        "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer",
        "AI Engineer", "Machine Learning Engineer", "Data Engineer", "Data Analyst",
        "Cloud Engineer", "Cybersecurity Analyst", "Mobile Developer", "QA Engineer",
        "Software Architect", "SRE", "Blockchain Developer"
    ],
    "Non-Tech": [
        "Marketing Executive", "Sales Executive", "HR Executive", "Recruiter",
        "Finance Analyst", "Operations Manager", "Business Analyst", "Customer Success Manager",
        "Digital Marketer", "Content Strategist"
    ],
    "Design": [
        "UI Designer", "UX Designer", "Product Designer", "Graphic Designer",
        "Motion Designer", "Visual Designer"
    ],
    "Management": [
        "Product Manager", "Project Manager", "Team Lead", "Program Manager",
        "Engineering Manager"
    ],
    "Entry-Level": [
        "Intern", "Graduate Trainee", "Associate Engineer", "Junior Developer"
    ]
};

const TONES = [
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'confident', label: 'Confident' },
];

const LEVELS = [
    { id: 'beginner', label: 'Beginner', premium: false },
    { id: 'intermediate', label: 'Intermediate', premium: false },
    { id: 'advanced', label: 'Advanced', premium: false },
    { id: 'professional', label: 'Professional', premium: true },
];

const WORD_LIMITS = [
    { id: 300, label: '100-300 Words', premium: false },
    { id: 600, label: '300-600 Words', premium: false },
    { id: 1000, label: '600-1000 Words', premium: true },
];

export default function CoverLetter() {
    const { resumeFile, coverLetterData, setCoverLetterData, isPremium } = useResume();
    const [targetJob, setTargetJob] = useState('Frontend Developer');
    const [customJob, setCustomJob] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [tone, setTone] = useState('professional');

    // Experience Level Selection with Persistence & Locking
    const [level, setLevel] = useState(() => localStorage.getItem('cl_level') || 'intermediate');
    const [isLevelLocked, setIsLevelLocked] = useState(() => localStorage.getItem('cl_level_locked') === 'true');

    const [wordLimit, setWordLimit] = useState(300);

    const handleLevelSelect = (id) => {
        if (isLevelLocked) return;
        setLevel(id);
        setIsLevelLocked(true);
        localStorage.setItem('cl_level', id);
        localStorage.setItem('cl_level_locked', 'true');
    };

    const handleUnlockLevel = () => {
        setIsLevelLocked(false);
        localStorage.removeItem('cl_level_locked');
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [displayedContent, setDisplayedContent] = useState('');
    const [fullContent, setFullContent] = useState('');
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const scrollRef = useRef(null);

    // Rehydrate content on mount
    useEffect(() => {
        if (coverLetterData?.cover_letter && !isGenerating) {
            setDisplayedContent(coverLetterData.cover_letter);
            setFullContent(coverLetterData.cover_letter);
        }
    }, [coverLetterData]);

    // Typewriter effect simulation
    useEffect(() => {
        if (isGenerating && fullContent) {
            let index = 0;
            setDisplayedContent('');
            const interval = setInterval(() => {
                const char = fullContent[index];
                if (char !== undefined) {
                    setDisplayedContent((prev) => prev + char);
                }

                index++;
                if (index >= fullContent.length) {
                    clearInterval(interval);
                    setIsGenerating(false);
                }

                // Auto scroll
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 5);
            return () => clearInterval(interval);
        }
    }, [fullContent, isGenerating]);

    const handleGenerate = async () => {
        if (!resumeFile) {
            setError("Please upload a resume in the 'Resume' tab first.");
            return;
        }

        const selectedLevel = LEVELS.find(l => l.id === level);
        const selectedLimit = WORD_LIMITS.find(l => l.id === wordLimit);

        if ((selectedLevel?.premium || selectedLimit?.premium) && !isPremium) {
            setError("You've selected a Premium feature. Please upgrade to continue.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setDisplayedContent('');
        setFullContent('');

        try {
            const jobTitle = isCustom ? customJob : (targetJob || 'Software Engineer');
            const res = await jobApi.generateCoverLetter(
                resumeFile,
                `Role: ${jobTitle}. Focus on relevant skills for this position.`,
                jobTitle,
                tone,
                wordLimit,
                level,
                isPremium
            );

            // Robust data extraction
            const cleanAIResponse = (raw) => {
                if (!raw) return '';
                let content = raw;

                // 1. If it's already an object, find the right key
                if (typeof content === 'object' && !Array.isArray(content)) {
                    const key = level?.toUpperCase();
                    // Priority: Level Key > 'cover_letter' key > First available string value
                    content = content[key] || content['cover_letter'] ||
                        Object.values(content).find(v => typeof v === 'string') ||
                        Object.values(content)[0] || '';
                }

                // 2. Extract from JSON string if AI returned a block
                if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
                    try {
                        const parsed = JSON.parse(content);
                        return cleanAIResponse(parsed); // Recursive extraction
                    } catch (e) {
                        // Not valid JSON, proceed to string cleaning
                    }
                }

                // 3. Final string sanitization (Remove braces, markdown, undefined trails)
                if (content) {
                    let cleaned = String(content).trim();
                    // Strip leading/trailing braces if they wrap the whole text incorrectly
                    cleaned = cleaned.replace(/^\{/, '').replace(/\}$/, '');
                    // Strip Markdown
                    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
                    return cleaned.trim().replace(/undefined$/, '');
                }

                return '';
            };

            const finalLetter = cleanAIResponse(res.data?.cover_letter || res.data);

            if (finalLetter) {
                setFullContent(finalLetter);
                // Keep context in sync with the clean string, not the raw object
                setCoverLetterData({ ...res.data, cover_letter: finalLetter });
            } else {
                throw new Error("AI Engine returned empty content. Please try again.");
            }
        } catch (err) {
            setError(err.message || "Failed to generate cover letter.");
            setIsGenerating(false);
        }
    };

    // Safe multi-paragraph rendering logic
    const renderParagraphs = () => {
        if (!displayedContent) return null;

        // Split by newlines and filter out empty segments
        const paragraphs = String(displayedContent)
            .split('\n')
            .map(p => p.trim())
            .filter(p => p.length > 0);

        return paragraphs.map((para, idx) => (
            <p key={`para-${idx}`} className="mb-6 last:mb-0 leading-[1.8] text-foreground/90">
                {para}
                {/* Show cursor only on the very last paragraph while generating */}
                {isGenerating && idx === paragraphs.length - 1 && (
                    <span className="inline-block w-1.5 h-5 bg-primary ml-1 animate-pulse align-middle" />
                )}
            </p>
        ));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(displayedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentWordCount = displayedContent.trim().split(/\s+/).length;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Cover Letter 2.0</h1>
                    <p className="text-muted-foreground mt-2">Production-grade generation with industry-specific tailoring.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="premium-gradient text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                >
                    {isGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {isGenerating ? 'AI is Writing...' : 'Generate Power Letter'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
                        {/* Job Role Selection */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Target Job</label>
                            {!isCustom ? (
                                <div className="space-y-3">
                                    <select
                                        className="w-full bg-accent/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={targetJob}
                                        onChange={(e) => setTargetJob(e.target.value)}
                                    >
                                        {Object.entries(JOB_ROLES).map(([category, roles]) => (
                                            <optgroup key={category} label={category}>
                                                {roles.map(role => <option key={role} value={role}>{role}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setIsCustom(true)}
                                        className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                                    >
                                        <PlusCircle className="h-3 w-3" /> Enter custom title
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="e.g. Senior Staff Engineer"
                                        className="w-full bg-accent/30 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={customJob}
                                        onChange={(e) => setCustomJob(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setIsCustom(false)}
                                        className="text-xs text-muted-foreground font-medium hover:text-primary transition-colors"
                                    >
                                        Back to list
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Experience Level */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block text-flex items-center gap-2">
                                Applicant Level
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {LEVELS.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => handleLevelSelect(l.id)}
                                        disabled={isLevelLocked && level !== l.id}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${level === l.id
                                            ? 'border-primary bg-primary/10 text-primary font-bold'
                                            : isLevelLocked
                                                ? 'border-border/50 bg-accent/5 text-muted-foreground/30 opacity-40 cursor-not-allowed'
                                                : 'border-border bg-accent/10 text-muted-foreground hover:bg-accent/20'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {l?.label}
                                            {level === l.id && isLevelLocked && <Check className="h-3 w-3" />}
                                        </span>
                                        {l.premium && !isPremium && <Lock className="h-3 w-3 opacity-50" />}
                                    </button>
                                ))}
                                {isLevelLocked && (
                                    <button
                                        onClick={handleUnlockLevel}
                                        className="mt-2 text-[10px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1 justify-center py-2 bg-primary/5 rounded-lg border border-primary/20"
                                    >
                                        <RefreshCw className="h-3 w-3" /> Change Level
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Word Limit */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Word Limit</label>
                            <div className="space-y-2">
                                {WORD_LIMITS.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => setWordLimit(w.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs transition-all ${wordLimit === w.id
                                            ? 'border-primary bg-primary/10 text-primary font-bold'
                                            : 'border-border bg-accent/10 text-muted-foreground'
                                            }`}
                                    >
                                        {w.label}
                                        {w.premium && !isPremium && <Lock className="h-3 w-3 opacity-50" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tone Selector */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Tone</label>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTone(t.id)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${tone === t.id
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-border bg-accent/20 text-muted-foreground'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500 text-xs"
                        >
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <div>
                                <p className="font-bold">Attention Required</p>
                                <p className="mt-1 leading-relaxed">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-3">
                    <div className="bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
                        {/* ToolBar */}
                        <div className="px-8 py-5 border-b border-border bg-accent/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-foreground/80">Tailored_Response.docx</span>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3 text-green-500" /> AI VERIFIED
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                            {(tone || 'professional')?.toUpperCase()} • {(level || 'intermediate')?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="bg-accent/50 rounded-full px-3 py-1 flex items-center gap-2 mr-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-muted-foreground">Words: {currentWordCount}</span>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-3 hover:bg-accent rounded-xl transition-all relative border border-border"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                </button>
                                <button className="p-3 hover:bg-accent rounded-xl transition-all border border-border">
                                    <Download className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Writing Canvas */}
                        <div className="relative flex-1 p-10 font-serif leading-relaxed text-lg text-foreground/90 overflow-y-auto max-h-[600px] scroll-smooth" ref={scrollRef}>
                            <AnimatePresence>
                                {!displayedContent && !isGenerating && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20"
                                    >
                                        <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mb-4">
                                            <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-muted-foreground/30">Select a role and click generate</h3>
                                        <p className="max-w-xs text-sm text-muted-foreground/40">Our AI will weave your unique experience into a compelling narrative.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative">
                                {renderParagraphs()}
                            </div>
                        </div>

                        {/* Footer Info */}
                        {displayedContent && (
                            <div className="p-6 border-t border-border bg-accent/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                <div className="flex items-center gap-4">
                                    <span>Generation ID: CL-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                                    <span>Model: LLAMA-3.2:1B</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-500">
                                    <ShieldCheck className="h-3 w-3" />
                                    ATS Optimized & Verified
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


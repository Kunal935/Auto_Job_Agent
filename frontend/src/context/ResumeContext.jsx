import React, { createContext, useContext, useState, useEffect } from 'react';

const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
    const [resumeData, setResumeData] = useState(() => {
        const saved = localStorage.getItem('resumeData');
        return saved ? JSON.parse(saved) : null;
    });

    const [coverLetterData, setCoverLetterData] = useState(() => {
        const saved = localStorage.getItem('coverLetterData');
        return saved ? JSON.parse(saved) : null;
    });

    const [resumeFile, setResumeFile] = useState(null);
    const [isPremium, setIsPremium] = useState(false);

    // Upload & Analysis Persistence
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisStage, setAnalysisStage] = useState(0);

    useEffect(() => {
        if (resumeData) localStorage.setItem('resumeData', JSON.stringify(resumeData));
        else localStorage.removeItem('resumeData');
    }, [resumeData]);

    useEffect(() => {
        if (coverLetterData) localStorage.setItem('coverLetterData', JSON.stringify(coverLetterData));
        else localStorage.removeItem('coverLetterData');
    }, [coverLetterData]);

    return (
        <ResumeContext.Provider value={{
            resumeData,
            setResumeData,
            resumeFile,
            setResumeFile,
            coverLetterData,
            setCoverLetterData,
            isPremium,
            setIsPremium,
            isAnalyzing,
            setIsAnalyzing,
            analysisProgress,
            setAnalysisProgress,
            analysisStage,
            setAnalysisStage
        }}>
            {children}
        </ResumeContext.Provider>
    );
};

export const useResume = () => {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error('useResume must be used within a ResumeProvider');
    }
    return context;
};

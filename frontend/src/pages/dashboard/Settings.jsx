import React, { useState } from 'react';
import {
    User,
    Target,
    MapPin,
    DollarSign,
    Bell,
    Shield,
    Zap,
    CheckCircle,
    Save
} from 'lucide-react';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile Preferences', icon: User },
        { id: 'job', label: 'Job Search', icon: Target },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'account', label: 'Account & Security', icon: Shield },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account and job search preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                    {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
                        {activeTab === 'profile' && (
                            <>
                                <section className="space-y-4">
                                    <h3 className="text-lg font-bold">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                                            <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" defaultValue="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                                            <input type="email" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none" defaultValue="john.doe@example.com" />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4 pt-8 border-t border-border">
                                    <h3 className="text-lg font-bold">Skills & Expertise</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Core Skills</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['React', 'Node.js', 'Python', 'AWS', 'Docker'].map(skill => (
                                                <div key={skill} className="px-3 py-1 bg-accent border border-border rounded-full text-xs font-medium flex items-center gap-2">
                                                    {skill}
                                                    <button className="hover:text-destructive">×</button>
                                                </div>
                                            ))}
                                            <button className="px-3 py-1 border border-dashed border-primary/50 text-primary text-xs font-bold rounded-full hover:bg-primary/5">
                                                + Add Skill
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === 'job' && (
                            <>
                                <section className="space-y-4">
                                    <h3 className="text-lg font-bold">Target Roles</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Experience Level</label>
                                        <select className="w-full px-4 py-2.5 rounded-lg border border-border bg-background outline-none">
                                            <option>Junior (1-2 years)</option>
                                            <option>Mid-level (3-5 years)</option>
                                            <option selected>Senior (5-10 years)</option>
                                            <option>Lead / Manager (10+ years)</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Minimum Salary</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input type="text" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background outline-none" defaultValue="140,000" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Desired Location</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input type="text" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background outline-none" defaultValue="San Francisco, Remote" />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                {[
                                    { title: 'Job Match Alerts', desc: 'Get notified when a job matches your profile > 90%' },
                                    { title: 'Application Updates', desc: 'Real-time status updates on your sent applications' },
                                    { title: 'AI Research Insights', desc: 'Weekly reports on market trends for your skills' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold">Subscription Plan</h4>
                                <p className="text-sm text-muted-foreground">You are currently on the <span className="text-primary font-bold">Pro Plan</span></p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-bold hover:bg-accent transition-colors">
                            Manage Billing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

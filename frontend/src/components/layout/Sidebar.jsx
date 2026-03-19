import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FileUp,
    Briefcase,
    FileText,
    Settings,
    LogOut,
    Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileUp, label: 'Resume', path: '/resume' },
    { icon: Briefcase, label: 'Job Matches', path: '/matches' },
    { icon: FileText, label: 'Cover Letter', path: '/cover-letter' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
    return (
        <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Zap className="text-white w-6 h-6 fill-white" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    AutoJobAgent
                </span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-colors",
                            "group-hover:text-primary"
                        )} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-border">
                <div className="bg-primary/5 rounded-xl p-4 mb-4 border border-primary/10">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Premium Plan</p>
                    <p className="text-sm text-foreground mb-3">Get unlimited AI cover letters and job tracking.</p>
                    <button className="w-full premium-gradient text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity">
                        Upgrade Now
                    </button>
                </div>
                <button className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 group">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium group-hover:block">Logout</span>
                </button>
            </div>
        </div>
    );
}

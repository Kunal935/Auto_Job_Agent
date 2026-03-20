import React from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 px-8 flex items-center justify-between ml-64">
            <div className="relative w-96">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                </span>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-accent/50 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="Search jobs, resumes..."
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
                </button>

                <div className="h-8 w-px bg-border mx-2"></div>

                <button className="flex items-center gap-3 p-1 rounded-full hover:bg-accent transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                        JD
                    </div>
                    <div className="hidden md:flex flex-col items-start leading-none gap-1 mr-2">
                        <span className="text-sm font-medium">John Doe</span>
                        <span className="text-[10px] text-muted-foreground">Pro Member</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>
        </header>
    );
}

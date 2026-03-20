import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col">
                <Navbar />
                <main className="ml-64 p-8 min-h-[calc(100vh-64px)]">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

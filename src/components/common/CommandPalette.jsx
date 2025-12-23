import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    Settings,
    Plus,
    Search,
    CreditCard,
    Target,
    Zap
} from 'lucide-react';
import { useTour } from '../../context/TourContext';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { startTour } = useTour();

    // Toggle with Cmd+K or Ctrl+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <Command.Input
                    placeholder="Type a command or search..."
                    className="w-full h-14 bg-transparent outline-none text-lg text-slate-800 dark:text-white placeholder:text-slate-400"
                />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
                <Command.Empty className="py-6 text-center text-slate-500">
                    No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-bold text-slate-400 px-2 py-1.5 uppercase">
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/'))}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <LayoutDashboard size={18} />
                        Go to Dashboard
                    </Command.Item>
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/wallets'))}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <Wallet size={18} />
                        My Wallets
                    </Command.Item>
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/analytics'))}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <PieChart size={18} />
                        Analytics
                    </Command.Item>
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/settings'))}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <Settings size={18} />
                        Settings
                    </Command.Item>
                </Command.Group>

                <Command.Separator className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                <Command.Group heading="Actions" className="text-xs font-bold text-slate-400 px-2 py-1.5 uppercase">
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/wallets'))}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <CreditCard size={18} />
                        Add New Loan / Wallet
                    </Command.Item>
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/budgets'))}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <Target size={18} />
                        Create Budget
                    </Command.Item>
                    <Command.Item
                        onSelect={() => runCommand(() => startTour())}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/20 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 cursor-pointer transition-colors"
                    >
                        <Zap size={18} className="text-amber-500" />
                        Start App Tour
                    </Command.Item>
                </Command.Group>
            </Command.List>

            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
                <span>Use arrow keys to navigate</span>
                <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">ESC</kbd> to close
                </div>
            </div>
        </Command.Dialog>
    );
};

export default CommandPalette;

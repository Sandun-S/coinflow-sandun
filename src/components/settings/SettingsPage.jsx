
import React from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import { useSettings } from '../../context/SettingsContext';
import { Moon, Sun, Globe, Download, Database } from 'lucide-react'; // Import Download, Database
import ManageCategories from './ManageCategories';
import DataBackupModal from './DataBackupModal';
const SettingsPage = () => {
    const { theme, setTheme, currency, setCurrency } = useSettings();
    const [isBackupOpen, setIsBackupOpen] = React.useState(false);

    return (
        <MainLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">Customize your CoinFlow experience.</p>
            </div>

            <div className="max-w-2xl space-y-6">

                {/* Categories Management */}
                <ManageCategories />

                {/* Appearance */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Appearance</h3>
                            <p className="text-sm text-slate-500">Customize the look and feel.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-purple-600' : 'bg-slate-200'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </Card>


                {/* Preferences */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Preferences</h3>
                            <p className="text-sm text-slate-500">Regional settings and formats.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Currency</span>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="LKR">LKR (Rs)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                </Card>

                {/* Data Management */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Data Management</h3>
                            <p className="text-sm text-slate-500">Backup, restore, or export your financial data.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Backup & Restore</span>
                            <span className="text-xs text-slate-500">Save your data locally or restore from a backup.</span>
                        </div>
                        <button
                            onClick={() => setIsBackupOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors font-medium text-sm border border-indigo-100 dark:border-indigo-800"
                        >
                            <Download size={16} />
                            Manage Data
                        </button>
                    </div>
                </Card>

            </div>

            <DataBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
        </MainLayout>
    );
};

export default SettingsPage;

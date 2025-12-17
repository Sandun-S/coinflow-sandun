
import React from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import { useSettings } from '../../context/SettingsContext';
import { Moon, Sun, DollarSign, Globe } from 'lucide-react';

const SettingsPage = () => {
    const { theme, setTheme, currency, setCurrency } = useSettings();

    return (
        <MainLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h2>
                <p className="text-gray-500 dark:text-gray-400">Customize your CoinFlow experience.</p>
            </div>

            <div className="max-w-2xl space-y-6">

                {/* Appearance */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Appearance</h3>
                            <p className="text-sm text-gray-500">Customize the look and feel.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-200'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </Card>


                {/* Preferences */}
                <Card>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Preferences</h3>
                            <p className="text-sm text-gray-500">Regional settings and formats.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Currency</span>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="LKR">LKR (Rs)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                </Card>

            </div>
        </MainLayout>
    );
};

export default SettingsPage;


import React from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import { useSettings } from '../../context/SettingsContext';
import { useTransactions } from '../../hooks/useTransactions'; // Import transactions
import { Moon, Sun, DollarSign, Globe, Download, Database } from 'lucide-react'; // Import Download, Database

const SettingsPage = () => {
    const { theme, setTheme, currency, setCurrency } = useSettings();
    const { transactions } = useTransactions(); // Get transactions

    const handleExport = () => {
        if (!transactions || transactions.length === 0) {
            alert("No data to export.");
            return;
        }

        // define columns
        const headers = ["ID", "Date", "Description", "Category", "Amount", "Type"];

        // map data
        const rows = transactions.map(t => [
            t.id,
            new Date(t.date).toLocaleDateString(),
            `"${t.text}"`, // escape commas
            t.category,
            Math.abs(t.amount), // absolute amount
            t.amount < 0 ? "Expense" : "Income"
        ]);

        // combine
        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        // create blob
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `coinflow_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">Customize your CoinFlow experience.</p>
            </div>

            <div className="max-w-2xl space-y-6">

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
                            <p className="text-sm text-slate-500">Manage and export your data.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Export Transactions</span>
                            <span className="text-xs text-slate-500">Download all your records as a CSV file.</span>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium text-sm"
                        >
                            <Download size={16} />
                            Download CSV
                        </button>
                    </div>
                </Card>

            </div>
        </MainLayout>
    );
};

export default SettingsPage;

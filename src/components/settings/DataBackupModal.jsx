import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { Download, Upload, FileJson, FileSpreadsheet, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useAccounts } from '../../context/AccountContext';
import { useCategories } from '../../context/CategoryContext';
import { useBudgets } from '../../context/BudgetContext';
import { useSubscriptions } from '../../context/SubscriptionContext';

const DataBackupModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('backup'); // 'backup' or 'restore'
    const [backupFormat, setBackupFormat] = useState('json'); // 'json' or 'csv'

    // Backup Selection State
    const [selectedEntities, setSelectedEntities] = useState({
        transactions: true,
        accounts: true,
        categories: true,
        budgets: true,
        subscriptions: true
    });

    // Restore State
    const [importFile, setImportFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [importStatus, setImportStatus] = useState('idle'); // idle, processing, success, error
    const [importLog, setImportLog] = useState([]);
    const fileInputRef = useRef(null);

    // Context Hooks
    const { transactions, addTransaction } = useTransactions();
    const { accounts, addAccount } = useAccounts();
    const { categories, addCategory } = useCategories();
    const { budgets, setBudget } = useBudgets();
    const { subscriptions, addSubscription } = useSubscriptions();

    // --- EXPORT LOGIC ---

    const handleExport = () => {
        if (backupFormat === 'csv') {
            exportCSV();
        } else {
            exportJSON();
        }
    };

    const exportCSV = () => {
        if (!transactions || transactions.length === 0) {
            alert("No transactions to export.");
            return;
        }

        const headers = ["ID", "Date", "Description", "Category", "Amount", "Type", "Wallet", "CreatedAt"];
        const rows = transactions.map(t => [
            t.id,
            new Date(t.date).toLocaleDateString(),
            `"${t.text}"`,
            t.category,
            Math.abs(t.amount),
            t.amount < 0 ? "Expense" : "Income",
            t.accountName || "N/A", // Assuming accountName might be joined, usually it's just ID in normalized DBs but let's be safe
            t.createdAt || ""
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        downloadFile(csvContent, `coinflow_transactions_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    };

    const exportJSON = () => {
        const payload = {};

        if (selectedEntities.transactions) payload.transactions = transactions;
        if (selectedEntities.accounts) payload.accounts = accounts;
        if (selectedEntities.categories) payload.categories = categories;
        if (selectedEntities.budgets) payload.budgets = budgets;
        if (selectedEntities.subscriptions) payload.subscriptions = subscriptions;

        payload.meta = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            app: 'CoinFlow'
        };

        const jsonContent = JSON.stringify(payload, null, 2);
        downloadFile(jsonContent, `coinflow_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    };

    const downloadFile = (content, filename, type) => {
        const blob = new Blob([content], { type: `${type};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- IMPORT LOGIC ---

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== "application/json") {
            alert("Please upload a .json backup file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                setPreviewData({
                    transactions: json.transactions?.length || 0,
                    accounts: json.accounts?.length || 0,
                    categories: json.categories?.length || 0,
                    budgets: json.budgets?.length || 0,
                    subscriptions: json.subscriptions?.length || 0,
                    raw: json
                });
                setImportFile(file);
                setImportStatus('idle');
            } catch (err) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!previewData || !previewData.raw) return;
        setImportStatus('processing');
        const data = previewData.raw;
        let log = [];

        try {
            // Import Accounts
            if (data.accounts && selectedEntities.accounts) {
                let count = 0;
                for (const acc of data.accounts) {
                    // Check duplicate logic if needed, for now we append new
                    // Ideally we should check if name exists
                    const exists = accounts.find(a => a.name === acc.name);
                    if (!exists) {
                        const { id, ...cleanData } = acc;
                        await addAccount(cleanData);
                        count++;
                    }
                }
                log.push(`✅ Imported ${count} new Accounts`);
            }

            // Import Categories
            if (data.categories && selectedEntities.categories) {
                let count = 0;
                for (const cat of data.categories) {
                    const exists = categories.find(c => c.name === cat.name);
                    if (!exists) {
                        const { id, ...cleanData } = cat;
                        await addCategory(cleanData);
                        count++;
                    }
                }
                log.push(`✅ Imported ${count} new Categories`);
            }

            // Import Budgets
            if (data.budgets && selectedEntities.budgets) {
                let count = 0;
                for (const bud of data.budgets) {
                    // setBudget handles upsert/create
                    await setBudget(bud.category, bud.limit);
                    count++;
                }
                log.push(`✅ Restored ${count} Budgets`);
            }

            // Import Subscriptions
            if (data.subscriptions && selectedEntities.subscriptions) {
                let count = 0;
                for (const sub of data.subscriptions) {
                    const { id, ...cleanData } = sub;
                    // Simple append
                    await addSubscription(cleanData);
                    count++;
                }
                log.push(`✅ Imported ${count} Subscriptions`);
            }

            // Import Transactions
            if (data.transactions && selectedEntities.transactions) {
                let count = 0;
                for (const tx of data.transactions) {
                    const { id, ...cleanData } = tx;
                    // Always add as new for history integrity
                    await addTransaction(cleanData);
                    count++;
                }
                log.push(`✅ Imported ${count} Transactions`);
            }

            setImportLog(log);
            setImportStatus('success');

        } catch (error) {
            console.error(error);
            setImportStatus('error');
            setImportLog(prev => [...prev, `❌ Error: ${error.message}`]);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Data Backup & Restore">
            <div className="flex gap-4 mb-6 border-b border-slate-100 dark:border-slate-700">
                <button
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'backup' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('backup')}
                >
                    Backup / Export
                    {activeTab === 'backup' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                </button>
                <button
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'restore' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('restore')}
                >
                    Restore / Import
                    {activeTab === 'restore' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                </button>
            </div>

            {activeTab === 'backup' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => setBackupFormat('json')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${backupFormat === 'json' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300">
                                    <FileJson size={20} />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">JSON Format</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Complete backup of all data. Best for restoring later.</p>
                        </div>

                        <div
                            onClick={() => setBackupFormat('csv')}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${backupFormat === 'csv' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-white">CSV Format</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Transactions only. Best for Excel/Sheets analysis.</p>
                        </div>
                    </div>

                    {backupFormat === 'json' && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Include in Backup:</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(selectedEntities).map(key => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedEntities[key]}
                                            onChange={(e) => setSelectedEntities(p => ({ ...p, [key]: e.target.checked }))}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleExport}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Download size={20} />
                        Download {backupFormat.toUpperCase()} Backup
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {!previewData ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400 group-hover:text-indigo-500 transition-colors mb-4">
                                <Upload size={32} />
                            </div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">Click to upload backup file</h4>
                            <p className="text-sm text-slate-500">Only .json files supported</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <FileJson size={18} className="text-indigo-500" />
                                        Backup Summary
                                    </h4>
                                    <button onClick={() => { setPreviewData(null); setImportFile(null); setImportStatus('idle'); setImportLog([]) }} className="text-xs text-red-500 hover:underline">Change File</button>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <div className="text-slate-500">Transactions: <strong className="text-slate-800 dark:text-white">{previewData.transactions}</strong></div>
                                    <div className="text-slate-500">Wallets: <strong className="text-slate-800 dark:text-white">{previewData.accounts}</strong></div>
                                    <div className="text-slate-500">Categories: <strong className="text-slate-800 dark:text-white">{previewData.categories}</strong></div>
                                    <div className="text-slate-500">Budgets: <strong className="text-slate-800 dark:text-white">{previewData.budgets}</strong></div>
                                </div>
                            </div>

                            {importStatus === 'success' ? (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
                                        <Check size={20} /> Restore Complete
                                    </div>
                                    <ul className="text-sm text-emerald-600 dark:text-emerald-500 space-y-1">
                                        {importLog.map((l, i) => <li key={i}>{l}</li>)}
                                    </ul>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800 flex items-start gap-3">
                                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            Restoring data will append these records to your current data. It will not delete existing data.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleImport}
                                        disabled={importStatus === 'processing'}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        {importStatus === 'processing' ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
                                        {importStatus === 'processing' ? 'Restoring...' : 'Restore Selected Data'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default DataBackupModal;

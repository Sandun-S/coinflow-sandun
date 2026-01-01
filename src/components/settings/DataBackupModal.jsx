import React, { useState, useRef } from 'react';
import Modal from '../common/Modal';
import { Download, Upload, FileJson, FileSpreadsheet, Check, AlertCircle, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { useAccounts } from '../../context/AccountContext';
import { useCategories } from '../../context/CategoryContext';
import { useBudgets } from '../../context/BudgetContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';

const SECRET_KEY = "COINFLOW_SECURE_BACKUP_2024";

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
    const [securityStatus, setSecurityStatus] = useState(null); // 'valid', 'invalid', 'unchecked'
    const fileInputRef = useRef(null);

    // Context Hooks
    const { user, updateUser, isPro } = useAuth();
    const { transactions, addTransaction } = useTransactions();
    const { accounts, addAccount } = useAccounts();
    const { categories, addCategory } = useCategories();
    const { budgets, setBudget } = useBudgets();
    const { subscriptions, addSubscription } = useSubscriptions();

    // --- CRYPTO HELPER ---
    const generateSignature = async (data, emailSalt) => {
        try {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(SECRET_KEY + (emailSalt || ''));
            const msgData = encoder.encode(JSON.stringify(data));

            const key = await window.crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );

            const signature = await window.crypto.subtle.sign('HMAC', key, msgData);
            return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error("Signing error:", e);
            return null;
        }
    };

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
            t.accountName || "N/A",
            t.createdAt || ""
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        downloadFile(csvContent, `coinflow_transactions_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    };

    const exportJSON = async () => {
        // 1. Prepare Data Payload
        const data = {};
        if (selectedEntities.transactions) data.transactions = transactions;
        if (selectedEntities.accounts) data.accounts = accounts;
        if (selectedEntities.categories) data.categories = categories;
        if (selectedEntities.budgets) data.budgets = budgets;
        if (selectedEntities.subscriptions) data.subscriptions = subscriptions;

        // 2. Prepare User Meta (for Trial Protection)
        const userMeta = {
            email: user?.email,
            plan: user?.plan || 'Free',
            trialEndsAt: user?.trialEndsAt || null,
            isPro: !!isPro(user) // Snapshot current status
        };

        const exportPayload = {
            data,
            user: userMeta,
            meta: {
                version: '2.0',
                exportedAt: new Date().toISOString(),
                app: 'CoinFlow'
            }
        };

        // 3. Generate Signature
        // Sign { data, user } using the User's Email as part of the salt
        const signature = await generateSignature({ data, user: userMeta }, user?.email);
        exportPayload.signature = signature;

        const jsonContent = JSON.stringify(exportPayload, null, 2);
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
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);

                // Basic Validation
                const data = json.data || json; // Support legacy structure

                // Verify Signature if present
                let isValid = false;
                if (json.signature && json.user) {
                    const checkSig = await generateSignature({ data: json.data, user: json.user }, json.user.email);
                    isValid = checkSig === json.signature;
                    setSecurityStatus(isValid ? 'valid' : 'invalid');
                } else {
                    setSecurityStatus('unchecked');
                }

                setPreviewData({
                    transactions: data.transactions?.length || 0,
                    accounts: data.accounts?.length || 0,
                    categories: data.categories?.length || 0,
                    budgets: data.budgets?.length || 0,
                    subscriptions: data.subscriptions?.length || 0,
                    raw: json // Clean reference
                });
                setImportFile(file);
                setImportStatus('idle');
            } catch (err) {
                alert("Invalid JSON file.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!previewData || !previewData.raw) return;
        setImportStatus('processing');
        let log = [];

        try {
            const root = previewData.raw;
            const data = root.data || root; // Support v1/v2
            const userMeta = root.user;

            // 1. Security Check & Trial Sync
            if (root.signature && securityStatus === 'valid' && userMeta) {
                const currentUserIsPro = isPro(user); // Check if receiver is already Pro

                if (currentUserIsPro) {
                    log.push(`ℹ️ Current plan is Pro. Kept existing plan.`);
                } else {
                    // Receiver is Free/Trial
                    if (userMeta.plan === 'Pro' || userMeta.plan === 'lifetime') {
                        // Backup is Pro -> Do NOT grant Pro to a free account via import
                        log.push(`ℹ️ Imported data from Pro backup. Plan remains ${user.plan || 'Free'}.`);
                    } else if (userMeta.plan === 'Free') {
                        // Backup is Free -> Downgrade receiver to Free (Remove Trial for abuse prevention)
                        await updateUser(user.id, {
                            plan: 'Free',
                            trialEndsAt: null,
                            isPro: false
                        });
                        log.push(`ℹ️ Account synced to Free Plan (Trial Removed).`);
                    } else {
                        // Backup is likely on Trial (Free plan + trialEndsAt date)
                        // Sync the Trial Timer exactly to prevent trial hopping
                        if (userMeta.trialEndsAt) {
                            await updateUser(user.id, {
                                plan: 'Free',
                                trialEndsAt: userMeta.trialEndsAt
                            });
                            log.push(`ℹ️ Trial period synced with backup.`);
                        }
                    }
                }
            } else if (root.signature && securityStatus === 'invalid') {
                log.push(`⚠️ Security Warning: Backup signature mismatch. Plan updates skipped.`);
            }

            // 2. Import Data with ID Mapping
            const idMap = {
                accounts: {},
                categories: {}
            };

            // > Categories
            if (data.categories && selectedEntities.categories) {
                let count = 0;
                for (const cat of data.categories) {
                    const exists = categories.find(c => c.name === cat.name);
                    if (!exists) {
                        const { id, ...clean } = cat;
                        await addCategory(clean); // Assume safe
                        count++;
                    }
                }
                log.push(`✅ Imported ${count} new Categories`);
            }

            // > Accounts
            if (data.accounts && selectedEntities.accounts) {
                let count = 0;
                for (const acc of data.accounts) {
                    const exists = accounts.find(a => a.name === acc.name && a.type === acc.type);
                    if (!exists) {
                        const { id: oldId, ...clean } = acc;
                        // Import with FULL balance
                        const res = await addAccount(clean);
                        if (res && res.id) {
                            idMap.accounts[oldId] = res.id;
                        }
                        count++;
                    } else {
                        // Map old ID to existing ID
                        idMap.accounts[acc.id] = exists.id;
                    }
                }
                log.push(`✅ Imported ${count} new Accounts`);
            }

            // > Budgets
            if (data.budgets && selectedEntities.budgets) {
                let count = 0;
                for (const bud of data.budgets) {
                    await setBudget(bud.category, bud.limit);
                    count++;
                }
                log.push(`✅ Restored ${count} Budgets`);
            }

            // > Subscriptions
            if (data.subscriptions && selectedEntities.subscriptions) {
                let count = 0;
                for (const sub of data.subscriptions) {
                    const { id, ...clean } = sub;
                    // Map Wallet
                    if (clean.walletId && idMap.accounts[clean.walletId]) {
                        clean.walletId = idMap.accounts[clean.walletId];
                    }
                    await addSubscription(clean);
                    count++;
                }
                log.push(`✅ Imported ${count} Subscriptions`);
            }

            // > Transactions
            if (data.transactions && selectedEntities.transactions) {
                let count = 0;
                for (const tx of data.transactions) {
                    const { id, ...clean } = tx;

                    // Map Wallet
                    if (clean.accountId && idMap.accounts[clean.accountId]) {
                        clean.accountId = idMap.accounts[clean.accountId];

                        // SKIP BALANCE UPDATE
                        await addTransaction(clean, { skipBalanceUpdate: true });
                        count++;
                    } else {
                        if (selectedEntities.accounts) {
                            // Account was expected but not found/mapped
                            // Skip to prevent error
                        }
                    }
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
                            <p className="text-xs text-slate-500 dark:text-slate-400">Complete backup. Includes <span className="font-semibold text-indigo-500">Secure Signature</span>.</p>
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
                            <p className="text-xs text-slate-500 dark:text-slate-400">Transactions only. Best for Excel/Sheets.</p>
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
                                    <button onClick={() => { setPreviewData(null); setImportFile(null); setImportStatus('idle'); setImportLog([]); setSecurityStatus(null) }} className="text-xs text-red-500 hover:underline">Change File</button>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <div className="text-slate-500">Transactions: <strong className="text-slate-800 dark:text-white">{previewData.transactions}</strong></div>
                                    <div className="text-slate-500">Wallets: <strong className="text-slate-800 dark:text-white">{previewData.accounts}</strong></div>
                                    <div className="text-slate-500">Categories: <strong className="text-slate-800 dark:text-white">{previewData.categories}</strong></div>
                                    <div className="text-slate-500">Budgets: <strong className="text-slate-800 dark:text-white">{previewData.budgets}</strong></div>
                                </div>

                                {/* Security Badge */}
                                <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 border ${securityStatus === 'valid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : (securityStatus === 'invalid' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-600')}`}>
                                    {securityStatus === 'valid' ? <ShieldCheck size={18} className="shrink-0 mt-0.5" /> : (securityStatus === 'invalid' ? <ShieldAlert size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />)}
                                    <div className="text-xs">
                                        {securityStatus === 'valid' && <span><strong>Verified Backup:</strong> This file is signed and authentic. Account plan will be synced.</span>}
                                        {securityStatus === 'invalid' && <span><strong>Security Mismatch:</strong> Signature invalid. This file may have been modified. Plan details will be ignored.</span>}
                                        {securityStatus === 'unchecked' && <span><strong>Unverified Backup:</strong> No signature found (Legacy). Data will be imported, but plan status will not be updated.</span>}
                                    </div>
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
                                        {importStatus === 'processing' ? 'Restoring...' : 'Restore Data'}
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

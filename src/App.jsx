import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { SettingsProvider } from './context/SettingsContext';
import MainLayout from './components/layout/MainLayout';
import SummaryCards from './components/dashboard/SummaryCards';
import ExpenseChart from './components/dashboard/ExpenseChart';
import TransactionList from './components/dashboard/TransactionList';
import AddTransactionForm from './components/dashboard/AddTransactionForm';
import UpcomingSubscriptions from './components/dashboard/UpcomingSubscriptions';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import BudgetsPage from './components/budget/BudgetsPage';
import SubscriptionsPage from './components/subscriptions/SubscriptionsPage';
import TransactionsPage from './components/transactions/TransactionsPage';
import ProfilePage from './components/profile/ProfilePage';
import SettingsPage from './components/settings/SettingsPage';
import ContactPage from './components/pages/ContactPage';
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import MyWallets from './components/accounts/MyWallets';

import Modal from './components/common/Modal';
import Button from './components/common/Button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <header>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Overview of your personal finances.</p>
        </header>

        <Button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
          <Plus size={20} />
          New Transaction
        </Button>
      </div>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 z-40 hover:bg-indigo-700 active:scale-95 transition-all"
        aria-label="Add Transaction"
      >
        <Plus size={24} />
      </button>

      <SummaryCards />

      <div className="lg:hidden">
        <UpcomingSubscriptions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ExpenseChart />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <div className="hidden lg:block">
            <UpcomingSubscriptions />
          </div>
          <TransactionList onEdit={handleEdit} />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingTransaction ? "Edit Transaction" : "Add New Transaction"}
      >
        <AddTransactionForm onSuccess={handleClose} initialData={editingTransaction} />
      </Modal>
    </MainLayout>
  );
}

import { BudgetProvider } from './context/BudgetContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { CategoryProvider } from './context/CategoryContext';
import { AccountProvider } from './context/AccountContext';

// ...

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AccountProvider>
            <CategoryProvider>
              <TransactionProvider>
                <BudgetProvider>
                  <SubscriptionProvider>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/subscriptions" element={<SubscriptionsPage />} />
                        <Route path="/wallets" element={<MyWallets />} /> {/* Added Route */}
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Route>

                      {/* Admin Route */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      } />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </SubscriptionProvider>
                </BudgetProvider>
              </TransactionProvider>
            </CategoryProvider>
          </AccountProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

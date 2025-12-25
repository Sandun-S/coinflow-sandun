import React, { useEffect, useMemo } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useTour } from '../../context/TourContext';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AppTour = () => {
    const { run, setRun, stepIndex, setStepIndex, completeTour, tourType } = useTour();
    const { theme } = useSettings();
    const isDarkMode = theme === 'dark';
    const navigate = useNavigate();
    const location = useLocation();

    // Define Steps for each Module
    const tourSteps = useMemo(() => ({
        full: [
            {
                target: 'body',
                placement: 'center',
                title: 'Welcome to CoinFlow! 🚀',
                content: 'Let\'s take a complete tour of the features.',
                disableBeacon: true,
                data: { route: '/' }
            },
            {
                target: '[data-tour="dashboard-nav"]',
                content: 'This is your Dashboard. See your cash flow at a glance.',
                placement: 'auto',
                data: { route: '/' }
            },
            {
                target: '[data-tour="wallets-nav"]',
                content: 'Manage your Bank Accounts, Cards, and Cash here.',
                placement: 'auto',
                data: { route: '/wallets' } // Navigate to Wallets
            },
            {
                target: '[data-tour="add-wallet-btn"]',
                content: 'Click here to add a new account.',
                placement: 'auto',
                data: { route: '/wallets' }
            },
            {
                target: '[data-tour="add-transaction-fab"]',
                content: 'The magic button! Log income or expenses from anywhere.',
                placement: 'auto',
            },
            {
                target: '[data-tour="analytics-nav"]',
                content: 'View charts, savings rate, and predictions.',
                placement: 'auto',
                data: { route: '/analytics' }
            },
            {
                target: '[data-tour="profile-nav"]',
                content: 'Manage your settings, data, and restart this tour here.',
                placement: 'auto',
                data: { route: '/profile' }
            }
        ],
        wallets: [
            {
                target: 'body',
                placement: 'center',
                title: 'Wallet Manager 💳',
                content: 'Let\'s learn how to add and manage your accounts.',
                disableBeacon: true,
                data: { route: '/wallets' }
            },
            {
                target: '[data-tour="wallets-list"]',
                content: 'Your accounts appear here. You can see their balances.',
                placement: 'auto',
            },
            {
                target: '[data-tour="add-wallet-btn"]',
                content: 'Tap this + button to create a new wallet (e.g., "Demo Bank").',
                placement: 'auto',
                spotlightClicks: true, // Allow clicking
            },
            // Note: We can't easily target inside the modal unless it's open.
            // We'll give a general instruction.
            {
                target: 'body',
                placement: 'center',
                content: 'When the form opens, enter a Name (e.g. "Savings") and Type. Then click Save.',
            },
            {
                target: 'body',
                placement: 'center',
                content: 'Great! Your new wallet will appear in the list. You can Transfer money between them using the "Transfer" button.',
            }
        ],
        transactions: [
            {
                target: 'body',
                placement: 'center',
                title: 'Logging Transactions 💸',
                content: 'Tracking every penny is key to financial freedom.',
                disableBeacon: true,
                data: { route: '/' }
            },
            {
                target: '[data-tour="add-transaction-fab"]',
                content: 'Click this button to open the transaction form.',
                placement: 'auto',
                spotlightClicks: true,
            },
            {
                target: 'body',
                placement: 'center',
                content: 'Select "Income" or "Expense". Enter the amount, pick a Category, and choose which Wallet used.',
            },
            {
                target: 'body',
                placement: 'center',
                content: 'Click "Save Transaction". It will instantly update your dashboard balances.',
            },
            {
                target: '[data-tour="transaction-list"]',
                content: 'Your recent transactions appear here. Tap one to Edit or Delete (Trash Icon).',
                placement: 'auto',
            }
        ],
        budgets: [
            {
                target: 'body',
                placement: 'center',
                title: 'Smart Budgets 📉',
                content: 'Set monthly limits to save more.',
                disableBeacon: true,
                data: { route: '/budgets' }
            },
            {
                target: '[data-tour="set-budget-btn"]',
                content: 'Click here to set a limit for a category (e.g., "Food").',
                placement: 'auto',
                spotlightClicks: true
            },
            {
                target: 'body',
                placement: 'center',
                content: 'We will track your spending against this limit and warn you if you overspend.',
            }
        ],
        analytics: [
            {
                target: 'body',
                placement: 'center',
                title: 'Financial Analytics 📊',
                content: 'Let\'s analyze your spending habits.',
                disableBeacon: true,
                data: { route: '/analytics' }
            },
            {
                target: 'body',
                placement: 'top',
                content: 'See your Net Savings, Daily Average spend, and Top Categories here.',
            }
        ]
    }), []);

    const currentSteps = tourSteps[tourType] || tourSteps.full;

    const handleJoyrideCallback = (data) => {
        const { status, type, index, action } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            completeTour();
        } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
            // Determine next index
            const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);

            if (nextIndex >= 0 && nextIndex < currentSteps.length) {
                const nextStep = currentSteps[nextIndex];

                // Check if navigation is needed
                if (nextStep.data?.route && location.pathname !== nextStep.data.route) {
                    navigate(nextStep.data.route);
                    // We might need a small delay or just rely on React re-render
                }
                setStepIndex(nextIndex);
            } else {
                // End of tour
                setRun(false);
                completeTour();
            }
        }
    };

    // Auto-navigate for first step if needed when tour starts
    useEffect(() => {
        if (run && stepIndex === 0) {
            const firstStep = currentSteps[0];
            if (firstStep.data?.route && location.pathname !== firstStep.data.route) {
                navigate(firstStep.data.route);
            }
        }
    }, [run, stepIndex, currentSteps, location.pathname, navigate]);

    return (
        <Joyride
            steps={currentSteps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            disableOverlayClose={true}
            spotlightPadding={10}
            styles={{
                options: {
                    arrowColor: isDarkMode ? '#1e293b' : '#fff',
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    primaryColor: '#6366f1',
                    textColor: isDarkMode ? '#fff' : '#334155',
                    overlayColor: 'rgba(0, 0, 0, 0.6)',
                    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
                    zIndex: 10000,
                },
                buttonNext: {
                    backgroundColor: '#6366f1',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '10px 20px',
                    outline: 'none',
                    border: 'none',
                },
                buttonBack: {
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    marginRight: '10px',
                },
                buttonSkip: {
                    color: isDarkMode ? '#64748b' : '#94a3b8',
                }
            }}
            locale={{
                last: 'Finish',
                skip: 'End Tour',
                next: 'Next',
                back: 'Back'
            }}
        />
    );
};

export default AppTour;

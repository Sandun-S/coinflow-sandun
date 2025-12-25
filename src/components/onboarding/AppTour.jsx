import React, { useEffect, useMemo } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useTour } from '../../context/TourContext';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AppTour = () => {
    const { run, setRun, stepIndex, setStepIndex, completeTour, tourType, setCurrentStepTarget } = useTour();
    const { theme } = useSettings();
    const isDarkMode = theme === 'dark';
    const navigate = useNavigate();
    const location = useLocation();

    const isMobile = window.innerWidth < 768; // Simple check for Mobile
    const navPlacement = isMobile ? 'auto' : 'right'; // Force 'right' on desktop sidebar

    // Define Steps for each Module
    const tourSteps = useMemo(() => {

        // --- Reusable Steps ---
        const walletSteps = [
            {
                target: '[data-tour="wallets-list"]',
                content: 'Your accounts appear here. You can see their balances.',
                placement: 'auto',
            },
            ...(isMobile ? [
                {
                    target: '[data-tour="add-wallet-mobile-fab"]',
                    content: 'Tap the + button to see options.',
                    placement: 'top',
                    spotlightClicks: true,
                    disableOverlay: true,
                },
                {
                    target: '[data-tour="add-wallet-mobile-action"]',
                    content: 'Tap the Wallet icon to add a new account.',
                    placement: 'top',
                    spotlightClicks: true,
                    hideFooter: true,
                    disableOverlay: true,
                }
            ] : [
                {
                    target: '[data-tour="add-wallet-btn"]',
                    content: 'Tap this + button to create a new wallet (e.g., "Demo Bank").',
                    placement: 'auto',
                    spotlightClicks: true,
                    hideFooter: true,
                }
            ]),

            {
                target: '[data-tour="wallet-type-selector"]',
                content: 'First, select the account type (Bank, Cash, or even a Loan).',
                placement: 'bottom',
                disableOverlay: true,
                spotlightClicks: true,
                delay: 500,
                hideFooter: true,
                disableScrollParentFix: true,
            },
            {
                target: '[data-tour="wallet-name-input"]',
                content: 'Give your wallet a name, like "Main Savings".',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="wallet-balance-input"]',
                content: 'Enter your current balance here.',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="wallet-submit-btn"]',
                content: 'Click here to save your new wallet!',
                placement: 'bottom',
                disableOverlay: true,
                hideFooter: true,
            }
        ];

        const transactionSteps = [
            {
                target: isMobile ? '[data-tour="add-transaction-mobile"]' : '[data-tour="add-transaction-desktop"]',
                content: 'Click this button to open the transaction form.',
                placement: 'auto',
                spotlightClicks: true,
                hideFooter: true,
            },
            {
                target: '[data-tour="tx-type-toggle"]',
                content: 'Is this money coming in (Income) or going out (Expense)?',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="tx-wallet-picker"]',
                content: 'Choose which wallet is affected.',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="tx-text-input"]',
                content: 'What is this for? (e.g., "Lunch", "Salary").',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="tx-amount-input"]',
                content: 'How much?',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="category-picker"]',
                content: 'Select a category.',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="tx-submit-btn"]',
                content: 'Save it! Your dashboard will update instantly.',
                placement: 'bottom',
                disableOverlay: true,
                hideFooter: true,
            }
        ];

        const subscriptionSteps = [
            {
                target: isMobile ? '[data-tour="add-subscription-mobile"]' : '[data-tour="add-subscription-btn"]',
                content: 'Tap here to add a recurring bill like Netflix or Rent.',
                placement: 'auto',
                spotlightClicks: true,
                hideFooter: true,
            },
            {
                target: '[data-tour="sub-name-input"]',
                content: 'What is this subscription for?',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="sub-category-picker"]',
                content: 'Categorize it (e.g., Bills, Entertainment).',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="sub-amount-input"]',
                content: 'How much do you pay?',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="sub-cycle-select"]',
                content: 'Is it Monthly or Yearly?',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="sub-date-input"]',
                content: 'When is the next bill due?',
                placement: 'bottom',
                disableOverlay: true,
            },
            {
                target: '[data-tour="sub-submit-btn"]',
                content: 'Save it! We’ll remind you before it’s due.',
                placement: 'bottom',
                disableOverlay: true,
                hideFooter: true,
            }
        ];

        return {
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
                    placement: navPlacement,
                    disableFlip: !isMobile,
                    data: { route: '/' }
                },
                // --- Wallets Section of Full Tour ---
                {
                    target: '[data-tour="wallets-nav"]',
                    content: 'Manage your Bank Accounts, Cards, and Cash here.',
                    placement: navPlacement,
                    disableFlip: !isMobile,
                    data: { route: '/wallets' }
                },
                {
                    ...walletSteps[0],
                    data: { route: '/wallets' } // Ensure we are on the route for the first internal step
                },
                ...walletSteps.slice(1),

                // --- Transactions Section of Full Tour ---
                {
                    target: 'body', // Reset to Dashboard before showing transaction FAB
                    placement: 'center',
                    content: 'Now let\'s log a transaction.',
                    data: { route: '/' }
                },
                ...transactionSteps,

                // --- Budgets Section ---
                {
                    target: '[data-tour="budgets-nav"]',
                    content: 'Set monthly limits to save more.',
                    placement: navPlacement,
                    disableFlip: !isMobile,
                    data: { route: '/budgets' }
                },
                {
                    target: isMobile ? '[data-tour="set-budget-mobile"]' : '[data-tour="set-budget-desktop"]',
                    content: 'Click here to set a limit for a category (e.g., "Food").',
                    placement: 'auto',
                    spotlightClicks: true,
                    hideFooter: true,
                    data: { route: '/budgets' } // Ensure route
                },
                {
                    target: 'body',
                    placement: 'center',
                    content: 'We will track your spending against this limit and warn you if you overspend.',
                },
                {
                    target: '[data-tour="budget-category-picker"]',
                    content: 'Select the category you want to limit (e.g. Food, Transport).',
                    placement: 'bottom',
                    disableOverlay: true,
                },
                {
                    target: '[data-tour="budget-limit-input"]',
                    content: 'How much do you want to spend max?',
                    placement: 'bottom',
                    disableOverlay: true,
                },
                {
                    target: '[data-tour="budget-save-btn"]',
                    content: 'Save it to start tracking!',
                    placement: 'bottom',
                    disableOverlay: true,
                    hideFooter: true,
                },

                // --- Subscriptions Section ---
                {
                    target: '[data-tour="subscriptions-nav"]',
                    content: 'Track recurring bills so you are never late.',
                    placement: navPlacement,
                    disableFlip: !isMobile,
                    data: { route: '/subscriptions' }
                },
                {
                    ...subscriptionSteps[0],
                    data: { route: '/subscriptions' }
                },
                ...subscriptionSteps.slice(1),

                {
                    target: '[data-tour="profile-nav"]',
                    content: 'Manage your settings, data, and restart this tour here.',
                    placement: navPlacement,
                    disableFlip: !isMobile,
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
                ...walletSteps
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
                ...transactionSteps,
                {
                    target: '[data-tour="transaction-list"]',
                    content: 'Your recent transactions appear here. Tap one to Edit or Delete.',
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
                    target: isMobile ? '[data-tour="set-budget-mobile"]' : '[data-tour="set-budget-desktop"]',
                    content: 'Click here to set a limit for a category (e.g., "Food").',
                    placement: 'auto',
                    spotlightClicks: true,
                    hideFooter: true,
                },
                {
                    target: 'body',
                    placement: 'center',
                    content: 'We will track your spending against this limit and warn you if you overspend.',
                },
                {
                    target: '[data-tour="budget-category-picker"]',
                    content: 'Select the category you want to limit (e.g. Food, Transport).',
                    placement: 'bottom',
                    disableOverlay: true,
                },
                {
                    target: '[data-tour="budget-limit-input"]',
                    content: 'How much do you want to spend max?',
                    placement: 'bottom',
                    disableOverlay: true,
                },
                {
                    target: '[data-tour="budget-save-btn"]',
                    content: 'Save it to start tracking!',
                    placement: 'bottom',
                    disableOverlay: true,
                    hideFooter: true,
                }
            ],
            subscriptions: [
                {
                    target: 'body',
                    placement: 'center',
                    title: 'Subscriptions 🔄',
                    content: 'Never miss a bill payment again.',
                    disableBeacon: true,
                    data: { route: '/subscriptions' }
                },
                ...subscriptionSteps
            ]
        };
    }, []);

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

    // Sync current step target to Context
    useEffect(() => {
        if (run && currentSteps[stepIndex]) {
            setCurrentStepTarget(currentSteps[stepIndex].target);
        } else {
            setCurrentStepTarget(null);
        }
    }, [run, stepIndex, currentSteps, setCurrentStepTarget]);

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
                    zIndex: 11000,
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

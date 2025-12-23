import React, { useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useTour } from '../../context/TourContext';
import { useSettings } from '../../context/SettingsContext';

const AppTour = () => {
    const { run, setRun, stepIndex, setStepIndex, completeTour } = useTour();
    const { theme } = useSettings();
    const isDarkMode = theme === 'dark';

    // Define Tour Steps
    const steps = [
        {
            target: 'body',
            placement: 'center',
            title: 'Welcome to CoinFlow! 🚀',
            content: 'Let\'s take a quick tour to help you get the most out of your financial journey.',
            disableBeacon: true,
        },
        {
            target: '[data-tour="dashboard-nav"]',
            content: 'This is your Dashboard. It shows a quick overview of your "Cash & Bank" balance, monthly income, and expenses.',
        },
        {
            target: '[data-tour="wallets-nav"]',
            content: 'Go to "My Wallets" to add your Bank Accounts, Credit Cards, Loans, and Investments.',
        },
        {
            target: '[data-tour="add-transaction-fab"]',
            content: 'Click this button anywhere to instantly log an Income, Expense, or Transfer.',
        },
        {
            target: '[data-tour="analytics-nav"]',
            content: 'Check "Analytics" for deep insights like your Savings Rate, Loan Payoff Progress, and Net Worth.',
        },
        {
            target: '[data-tour="settings-nav"]',
            content: 'Customize Categories, Currency, and Manage Data in Settings.',
        },
        {
            target: 'body',
            placement: 'center',
            title: 'You\'re all set! 🎉',
            content: 'Explore the app and start taking control of your finances. You can restart this tour anytime from Settings.',
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { status, type, index } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            // Tour Finished
            setRun(false);
            completeTour();
        } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
            // Move to next step (handled by index prop mostly, but good for sync)
            const nextStepIndex = index + (data.action === ACTIONS.PREV ? -1 : 1);
            setStepIndex(nextStepIndex);
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    arrowColor: isDarkMode ? '#1e293b' : '#fff',
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    primaryColor: '#6366f1', // Indigo-500
                    textColor: isDarkMode ? '#fff' : '#334155',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
                    zIndex: 10000,
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                buttonNext: {
                    backgroundColor: '#6366f1',
                    fontSize: '14px',
                    fontWeight: 'bold',
                },
                buttonBack: {
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                }
            }}
            locale={{
                last: 'Finish',
                skip: 'Skip Tour',
            }}
        />
    );
};

export default AppTour;

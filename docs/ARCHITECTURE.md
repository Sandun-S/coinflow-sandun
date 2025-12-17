# CoinFlow Architecture

## Overview
CoinFlow is a personal expense tracker dashboard built with React, Vite, and Tailwind CSS. It focuses on a modular architecture to ensure scalability and maintainability.

## Technology Stack
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context API
- **Backend Service**: Firebase (Auth, Firestore, Hosting)

## Folder Structure

```
CoinFlow/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, global styles
│   ├── components/         # UI Components
│   │   ├── common/         # Reusable atoms (Button, Input, Card, Modal)
│   │   ├── layout/         # Layout components (Sidebar, MobileNav, MainLayout)
│   │   ├── dashboard/      # Dashboard widgets (ExpenseChart, TransactionList)
│   │   ├── subscriptions/  # Subscription-specific components (SubscriptionsPage)
│   │   ├── budget/         # Budget-specific components (BudgetsPage)
│   │   ├── analytics/      # Analytics-specific components (AnalyticsPage)
│   ├── context/            # Global state providers
│   │   ├── AuthContext.jsx         # User authentication
│   │   ├── TransactionContext.jsx  # Transactions CRUD
│   │   ├── SubscriptionContext.jsx # Subscriptions CRUD
│   │   ├── BudgetContext.jsx       # Budget management
│   │   └── SettingsContext.jsx     # Theme & Currency
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Firebase configuration
│   ├── App.jsx             # Main application entry
│   └── main.jsx            # Entry point
├── index.html
├── firebase.json           # Hosting configuration
├── firestore.rules         # Security rules
└── vite.config.js
```

## Component Hierarchy

- **App**
  - **MainLayout**
    - **Sidebar** (Desktop Navigation)
    - **MobileNav** (Mobile Bottom Bar)
    - **Pages** (Routed)
      - **Dashboard**: Summary Cards, Charts, Recent Transactions
      - **Analytics**: Trend Lines, Category Breakdown, Time Filters
      - **Budgets**: Monthly Spending Limits, Progress Bars
      - **Subscriptions**: Recurring Bills, Fixed Cost Summary
      - **Settings**: Theme, Currency, Data Management
      - **Contact**: Support Form

## Data Model (Firestore)

### `users` (collection)
- `uid`: User ID
- `email`: User Email
- `displayName`: User Name
- `photoURL`: Profile Picture

### `transactions` (collection)
- `userId`: Reference to User
- `amount`: Number
- `description`: String
- `category`: String
- `date`: ISO String
- `type`: 'income' | 'expense'

### `subscriptions` (collection)
- `userId`: Reference to User
- `name`: String
- `amount`: Number
- `billingCycle`: 'Monthly' | 'Yearly'
- `nextBillingDate`: ISO String

### `budgets` (collection)
- `userId`: Reference to User
- `category`: String
- `limit`: Number

## Key Design Principles
1. **Separation of Concerns**: Logic is separated into hooks, global state in context, and UI in components.
2. **Context-Based State**: Each major feature (Auth, Transactions, Subscriptions) has its own dedicated Context provider.
3. **Responsive**: Mobile-first approach with dedicated components (`MobileNav`) for smaller screens.
4. **Secure by Default**: Firestore rules restrict access based on `request.auth.uid`.

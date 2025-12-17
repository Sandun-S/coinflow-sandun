# Phase 9: Subscriptions & Recurring Module Plan

## Goal
Help users track recurring expenses (Netflix, Rent, etc.) and visualize monthly fixed costs to avoid "subscription fatigue."

## Proposed Changes

### 1. Data Layer
#### [NEW] [SubscriptionContext.jsx](file:///d:/Sandun/sandun_edu/Google_antigravity/test02/CoinFlow/src/context/SubscriptionContext.jsx)
- **Collection**: `subscriptions`
- **Fields**: `userId`, `name`, `amount`, `billingCycle` (Monthly/Yearly), `nextBillingDate`.
- **Functions**: `addSubscription`, `deleteSubscription`, `updateSubscription`.
- **Hooks**: `useSubscriptions()`.

### 2. UI - Subscriptions Page
#### [NEW] [SubscriptionsPage.jsx](file:///d:/Sandun/sandun_edu/Google_antigravity/test02/CoinFlow/src/components/subscriptions/SubscriptionsPage.jsx)
- **Summary Card**: "Total Monthly Fixed Cost". (Amortize yearly costs / 12).
- **List View**: Cards or Table showing active subscriptions and days until due.
- **Add Form**: Modal or Drawer to input subscription details.

### 3. Dashboard Integration
#### [MODIFY] [App.jsx](file:///d:/Sandun/sandun_edu/Google_antigravity/test02/CoinFlow/src/App.jsx)
- Add user-friendly alert/widget: "Upcoming Bills: Netflix due in 3 days".

### 4. Navigation
#### [MODIFY] [Sidebar.jsx](file:///d:/Sandun/sandun_edu/Google_antigravity/test02/CoinFlow/src/components/layout/Sidebar.jsx)
#### [MODIFY] [MobileNav.jsx](file:///d:/Sandun/sandun_edu/Google_antigravity/test02/CoinFlow/src/components/layout/MobileNav.jsx)
- Add "Subscriptions" link with an icon (e.g., `RefreshCw` or `Calendar`).

## Verification Plan
1.  **Add Subscription**: Add "Netflix", $15, Monthly, Due 25th.
2.  **Verify Calculation**: Check if "Total Monthly Fixed Cost" updates correctly ($15).
3.  **Dashboard Check**: Go to Home, see if alert appears if date is near.
4.  **Edit/Delete**: Modify amount, delete subscription.

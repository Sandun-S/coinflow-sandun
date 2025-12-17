# CoinFlow - Personal Finance Tracker 💸
![CoinFlow Banner](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**CoinFlow** is a modern, responsive expense tracking application designed to help you manage your personal finances with ease. It features real-time data sync, a sleek dark-mode-ready UI, and intuitive analytics.

## 🚀 Key Features

*   **Real-time Tracking**: Transactions are saved instantly to the cloud (Firestore).
*   **Subscriptions Module**: Track recurring bills, get due date alerts, and mark as paid.
*   **Google Sign-In**: Secure and fast authentication with Google (extends profile pictures).
*   **Visual Analytics**: Dynamic charts to break down your spending habits.
*   **Modern UI**: Beautiful Slate & Indigo theme with full Dark Mode support.
*   **Multi-Currency**: Support for multiple currencies (USD, LKR, EUR, etc.).
*   **Responsive**: Works perfectly on Desktop, Tablet, and Mobile.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS
*   **Backend**: Firebase (Auth, Firestore, Hosting)
*   **Charts**: Recharts
*   **Icons**: Lucide React

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Sandun-S/coinflow-sandun.git
    cd coinflow-sandun
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory and add your Firebase credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

---

## 🔄 How to Update

To update the application with new features or fixes:

1.  **Pull Latest Changes** (if working in a team)
    ```bash
    git pull origin main
    ```

2.  **Edit Code**: Make your changes in the `src` directory.

3.  **Test Locally**: Ensure everything works with `npm run dev`.

4.  **Build & Deploy**
    The project is set up with **GitHub Actions**. Simply push to the `main` branch to trigger an automatic deployment to Firebase Hosting.
    ```bash
    git add .
    git commit -m "Description of changes"
    git push origin main
    ```

---

## 🔒 Security

*   **Data Privacy**: Firestore Security Rules ensure that users can *only* access their own data.
*   **Authentication**: Managed securely via Firebase Auth.

---

Developed by Sandun.

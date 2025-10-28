# FlowRamp - Flow Blockchain On/Off Ramp

FlowRamp is a secure and efficient on/off-ramp for the Flow blockchain, designed to bridge traditional finance with the digital asset ecosystem. It provides a seamless experience for users to convert fiat currency (initially Nigerian Naira - NGN) into Flow stablecoins (fUSDC, fUSDT) and vice-versa.

## Key Features

-   **On-Ramp (Buy):** Users can purchase Flow stablecoins using their local fiat currency through a familiar payment provider interface.
-   **Off-Ramp (Sell):** Users can sell their Flow stablecoins and receive fiat currency directly in their bank accounts.
-   **Secure Wallet Integration:** Leverages the Flow Client Library (FCL) for non-custodial wallet interactions on the frontend.
-   **User Authentication:** Secure user authentication and management handled by Firebase.
-   **Transaction History:** Users can view a complete history of their on-ramp and off-ramp transactions.

## Architecture

This application is built with a modern, decoupled architecture, separating the frontend from the backend for improved security, scalability, and maintainability.

### Frontend (Next.js)

The frontend is a server-rendered React application built with Next.js and hosted on Vercel.

-   **Framework:** [Next.js](https://nextjs.org/) 14 (with App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
-   **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth) (Client SDK)
-   **Blockchain Interaction:** [Flow Client Library (FCL)](https://docs.onflow.org/fcl/) for wallet connections and client-side interactions.

### Backend (Node.js & Express)

The backend is a dedicated Node.js server built with Express, designed to be hosted on a platform like Render. It handles all secure logic and business operations.

-   **Framework:** [Express.js](https://expressjs.com/)
-   **Language:** JavaScript (Node.js)
-   **Blockchain Interaction:**
    -   [Flow Client Library (FCL)](https://docs.onflow.org/fcl/) for server-side transactions.
    -   Cadence scripts (`.cdc` files) for all on-chain logic.
-   **Database:** [Firestore](https://firebase.google.com/docs/firestore) for storing session and transaction data.
-   **Authentication:** [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) for verifying user JWTs.
-   **Payment Integration:** [Paystack](https://paystack.com/) (or other payment providers).
-   **Background Jobs:** A cron job system for monitoring blockchain deposits.

---

## 🚀 Quick Start

**New to FlowRamp?** Follow our step-by-step guide:

👉 **[QUICK_START.md](./QUICK_START.md)** - Get running in 5 minutes!

For detailed Paystack integration setup:

👉 **[PAYSTACK_SETUP.md](./PAYSTACK_SETUP.md)** - Complete Paystack configuration guide

For architecture and technical details:

👉 **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Full integration documentation

## Getting Started

Follow these instructions to set up and run the project locally for development.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) or another package manager
-   A [Firebase](https://console.firebase.google.com/) project with Authentication and Firestore enabled.
-   A [Flow Testnet](https://testnet-faucet.onflow.org/) account (already configured with testnet account).
-   A [Paystack](https://paystack.com/) account for NGN payments.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd flowramp-app
```

### 2. Set Up Environment Variables

This project requires two separate `.env` files: one for the frontend and one for the backend.

-   In the root directory, copy `.env.example` to `.env` and fill in your Firebase **client-side** credentials.
-   In the `backend/` directory, copy `backend/.env.example` to `backend/.env` and fill in your **server-side** credentials (Firebase Admin, Flow private key, Payment Provider secret key).

### 3. Install Dependencies

You need to install dependencies for both the frontend and the backend.

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 4. Run the Development Servers

You will need two separate terminals to run both the frontend and backend servers concurrently.

**In your first terminal (Frontend):**

```bash
npm run dev
```

Your Next.js frontend will be running at `http://localhost:3000`.

**In your second terminal (Backend):**

```bash
cd backend
npm run dev
```

Your Node.js backend will be running at `http://localhost:3001`.

---

## Deployment

This application is designed to be deployed in two parts:

### 1. Backend on Render

The Node.js backend should be deployed as a **Web Service** on Render.

-   **Build Command:** `npm install`
-   **Start Command:** `npm start`
-   **Environment Variables:** Add all variables from your `backend/.env` file to the Render environment.

The deposit watcher script should be deployed as a **Cron Job** on Render.

-   **Command:** `node scripts/deposit-watcher.js`
-   **Schedule:** Set it to run at a desired interval (e.g., every 5 minutes: `*/5 * * * *`).

### 2. Frontend on Vercel

The Next.js frontend is optimized for deployment on Vercel.

1.  Create a new project on Vercel and connect your Git repository.
2.  Vercel will automatically detect that it is a Next.js project.
3.  Add your frontend environment variables from your root `.env` file to the Vercel project settings.
4.  **Crucially, set the `NEXT_PUBLIC_BACKEND_URL` variable to the public URL of your deployed Render backend service.**

---

## Project Structure

```
.
├── app/                  # Next.js App Router (Frontend Pages)
│   ├── buy/
│   └── sell/
├── backend/              # Node.js Express Server
│   ├── cadence/          # Cadence scripts (.cdc files)
│   ├── lib/              # Backend business logic
│   ├── routes/           # API route definitions
│   └── server.js         # Express server entry point
├── components/           # Reusable React components
├── lib/firebase/         # Client-side Firebase setup
└── public/               # Static assets
```

# FlowRamp - Flow Blockchain On/Off Ramp

Live app: https://flowramp.xyz/

FlowRamp is a Flow-focused on-ramp and off-ramp product for users moving between Nigerian Naira and assets in the Flow ecosystem. The current build focuses on wallet connection, authenticated transaction flows, dashboard visibility, admin tooling, and the transaction orchestration needed to support local fiat rails.

## 🚀 Key Features

-   **💳 On-Ramp Session Flow:** Start a buy flow, create a tracked session, and route the user into a fiat collection pipeline
-   **💰 Off-Ramp Request Flow:** Create sell requests, generate deposit instructions, and track transaction state
-   **🔒 Wallet Ownership Verification:** Cryptographic signature verification to prove wallet ownership
-   **🔐 Secure Authentication:** Firebase Authentication with email/password and Google OAuth
-   **📊 Transaction Dashboard:** View complete transaction history and manage your profile
-   **👤 KYC and Admin Scaffolding:** Basic compliance and admin review flows for transaction operations
-   **⚡ Transaction State Tracking:** Session and request status updates across the user journey

## Current Status

-   **Live today:** Landing page, auth, wallet connect, dashboard, buy and sell session creation, Flow wallet signature verification, and core transaction tracking UX
-   **Partially implemented:** Admin operations, KYC workflow, rate management, deposit monitoring, and payout orchestration
-   **In progress:** Provider-agnostic fiat collection and settlement infrastructure for NGN rails

## Architecture

This application is built with a modern, decoupled architecture, separating the frontend from the backend for improved security, scalability, and maintainability.

### Frontend (Next.js)

The frontend is a server-rendered React application built with Next.js and available at https://flowramp.xyz/.

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
-   **Payment Integration:** Provider-agnostic backend design for local fiat rails and exchange execution.
-   **Background Jobs:** A cron job system for monitoring blockchain deposits.

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Flow Client Library (FCL) for blockchain interactions
- Firebase Authentication

**Backend:**
- Node.js with Express
- Firebase Admin SDK
- Flow blockchain integration
- Firestore database
- Fiat provider and exchange orchestration

**Blockchain:**
- Flow Mainnet
- Cadence smart contracts
- ECDSA_P256 signature algorithm

---

## 📋 Getting Started

Follow these instructions to set up and run the project locally for development.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) or another package manager
-   A [Firebase](https://console.firebase.google.com/) project with Authentication and Firestore enabled.
-   A Flow account funded for mainnet testing.
-   Access to the fiat provider or exchange credentials you plan to use in your environment.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd flowramp-app
```

### 2. Set Up Environment Variables

This project requires two separate `.env` files: one for the frontend and one for the backend.

#### Frontend Environment Variables (`.env.local`)

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

#### Backend Environment Variables (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```bash
# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com

# Flow Blockchain
SERVICE_PRIVATE_KEY=your_flow_private_key_64_chars
SERVICE_WALLET_ADDRESS=0xyourflowaddress
FLOW_NETWORK=mainnet
FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org

# Fiat / Exchange Providers
PAYMENT_PROVIDER_SECRET_KEY=your_provider_secret
PAYMENT_PROVIDER_PUBLIC_KEY=your_provider_public

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

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

## 🚀 Deployment

This application is designed to be deployed in two parts:

### Backend Deployment (Render)

1. **Create a Web Service** on [Render](https://render.com)
   - Connect your Git repository
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Add all backend environment variables

2. **Set Up Cron Job** (Optional - for deposit monitoring)
   - Command: `cd backend && node scripts/deposit-watcher.js`
   - Schedule: `*/5 * * * *` (every 5 minutes)

3. **Configure Provider Webhooks**
   - Point your collection or payout provider webhook to your backend webhook endpoint
   - Add the provider secret to your backend environment variables

### Frontend Deployment

1. **Deploy the frontend**
   - Deploy the Next.js app to your preferred frontend host
   - Point your domain to the deployed frontend

2. **Environment Variables**
   - Add all frontend environment variables
   - Set `NEXT_PUBLIC_BACKEND_URL` to your Render backend URL

3. **Deploy**
   - Ensure the frontend points to the correct backend URL
   - Ensure your wallet and Flow environment variables match mainnet

---

## 📁 Project Structure

```
flowramp-app/
├── app/                       # Next.js App Router (Frontend Pages)
│   ├── admin/                 # Admin dashboard
│   ├── buy/                   # On-ramp page (buy crypto)
│   ├── sell/                  # Off-ramp page (sell crypto)
│   ├── dashboard/             # User dashboard
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
│
├── backend/                   # Node.js Express Server
│   ├── cadence/               # Cadence smart contracts
│   │   └── scripts/           # Flow blockchain scripts
│   ├── lib/                   # Backend utilities
│   │   ├── auth.js            # JWT authentication
│   │   ├── crypto.js          # P256 signature utilities
│   │   ├── firebase-admin.js  # Firebase Admin SDK setup
│   │   └── payment-processor.js # Payment processing logic
│   ├── routes/                # API endpoints
│   │   ├── admin.js           # Admin routes
│   │   ├── flow.js            # Flow blockchain routes
│   │   ├── kyc.js             # KYC verification routes
│   │   ├── offramp.js         # Off-ramp endpoints
│   │   ├── onramp.js          # On-ramp endpoints
│   │   ├── wallet.js          # Wallet management
│   │   ├── wallet-verification.js # Wallet signature verification
│   │   └── webhook.js         # Paystack webhooks
│   ├── scripts/               # Background jobs
│   │   └── deposit-watcher.js # Monitor blockchain deposits
│   └── server.js              # Express server entry point
│
├── components/                # React UI Components
│   ├── admin/                 # Admin-specific components
│   ├── flow/                  # Flow wallet components
│   │   ├── wallet-connect.tsx # Wallet connection with signature
│   │   └── wallet-balance.tsx # Balance display
│   ├── off-ramp/              # Sell crypto components
│   ├── on-ramp/               # Buy crypto components
│   └── ui/                    # shadcn/ui components
│
├── lib/                       # Frontend utilities
│   ├── api/                   # API client functions
│   ├── firebase/              # Firebase client setup
│   ├── flow/                  # Flow blockchain client
│   │   ├── fcl-client.ts      # FCL wrapper with signature verification
│   │   └── config.ts          # Flow network configuration
│   └── types/                 # TypeScript type definitions
│
└── public/                    # Static assets
```

---

## 🔌 API Endpoints

### Authentication Required
All protected endpoints require Firebase JWT token in Authorization header:
```
Authorization: Bearer <firebase_jwt_token>
```

### On-Ramp (Buy) Endpoints

- `POST /api/onramp/create-session` - Create new on-ramp session
- `GET /api/onramp/sessions` - Get user's on-ramp sessions
- `GET /api/onramp/session/:id` - Get specific session details

### Off-Ramp (Sell) Endpoints

- `POST /api/offramp/create-request` - Create new off-ramp request
- `GET /api/offramp/requests` - Get user's off-ramp requests
- `GET /api/offramp/request/:id` - Get specific request details
- `POST /api/offramp/transaction` - Get Cadence transaction for user to sign

### Wallet Endpoints

- `POST /api/wallet/verify` - Verify wallet ownership with signature
- `GET /api/wallet/balance` - Get wallet balance for Flow tokens

### KYC Endpoints

- `POST /api/kyc/submit` - Submit KYC verification
- `GET /api/kyc/status` - Get KYC verification status

### Webhook Endpoints (Public)

- `POST /api/webhook/paystack` - Provider webhook endpoint currently used for payment event handling

---

## 🔐 Security Features

- **Firebase Authentication** - Secure user authentication with JWT tokens
- **Wallet Signature Verification** - Cryptographic proof of wallet ownership using FCL
- **P256 Curve Signatures** - ECDSA_P256 signatures for Flow blockchain transactions
- **Timestamp Validation** - Prevents replay attacks on signature verification
- **CORS Protection** - Configured CORS for secure cross-origin requests
- **Environment Variables** - Sensitive credentials stored in environment variables
- **Webhook Verification** - Validates signed provider callbacks before processing

---

## 🎯 How It Works

### On-Ramp Flow (Current Product Flow)

1. User authenticates with Firebase
2. User connects Flow wallet (with signature verification)
3. User selects amount and asset preference
4. System creates on-ramp session in Firestore
5. Fiat collection and settlement pipeline is triggered
6. Provider callbacks and internal state updates move the session through review or processing
7. Transaction status is reflected in the product dashboard

### Off-Ramp Flow (Current Product Flow)

1. User authenticates with Firebase
2. User connects Flow wallet (with signature verification)
3. User enters bank details and amount
4. System creates off-ramp request with deposit address
5. User sends stablecoins to deposit address
6. Deposit monitoring and admin review move the request through its lifecycle
7. Provider payout orchestration completes the fiat side of the transaction

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions:
- Check the console logs for detailed error messages
- Ensure all environment variables are correctly set
- Verify Firebase and Flow blockchain configurations
- Check your provider webhook configuration and backend secrets

---

**Built with ❤️ for the Flow blockchain ecosystem**

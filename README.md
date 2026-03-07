# FlowRamp - Flow Blockchain On/Off Ramp

FlowRamp is a secure and efficient cryptocurrency on/off-ramp platform for the Flow blockchain. It bridges traditional finance with decentralized finance by enabling users to seamlessly convert fiat currency (Nigerian Naira) into Flow stablecoins (fUSDC, fUSDT) and vice versa.

## 🚀 Key Features

-   **💳 On-Ramp (Buy):** Purchase Flow stablecoins using local fiat currency through Paystack payment integration
-   **💰 Off-Ramp (Sell):** Sell Flow stablecoins and receive fiat currency directly to your bank account
-   **🔒 Wallet Ownership Verification:** Cryptographic signature verification to prove wallet ownership
-   **🔐 Secure Authentication:** Firebase Authentication with email/password and Google OAuth
-   **📊 Transaction Dashboard:** View complete transaction history and manage your profile
-   **👤 KYC Integration:** Know Your Customer verification for compliance
-   **⚡ Real-time Updates:** Live transaction status tracking and payment confirmation

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
- Paystack payment API
- Firestore database

**Blockchain:**
- Flow Testnet
- Cadence smart contracts
- ECDSA_P256 signature algorithm

---

## 📋 Getting Started

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
FLOW_NETWORK=testnet
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public

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

3. **Configure Paystack Webhook**
   - Go to Paystack Dashboard → Settings → Webhooks
   - Add webhook URL: `https://your-render-url.onrender.com/api/webhook/paystack`
   - Copy webhook secret to your environment variables

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   - Create new project on [Vercel](https://vercel.com)
   - Import your Git repository
   - Vercel auto-detects Next.js configuration

2. **Environment Variables**
   - Add all frontend environment variables
   - Set `NEXT_PUBLIC_BACKEND_URL` to your Render backend URL

3. **Deploy**
   - Vercel will automatically build and deploy
   - Each git push triggers automatic redeployment

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

- `POST /api/webhook/paystack` - Paystack payment webhook

---

## 🔐 Security Features

- **Firebase Authentication** - Secure user authentication with JWT tokens
- **Wallet Signature Verification** - Cryptographic proof of wallet ownership using FCL
- **P256 Curve Signatures** - ECDSA_P256 signatures for Flow blockchain transactions
- **Timestamp Validation** - Prevents replay attacks on signature verification
- **CORS Protection** - Configured CORS for secure cross-origin requests
- **Environment Variables** - Sensitive credentials stored in environment variables
- **Paystack Webhook Verification** - Validates webhook signatures from Paystack

---

## 🎯 How It Works

### On-Ramp Flow (Buy Crypto)

1. User authenticates with Firebase
2. User connects Flow wallet (with signature verification)
3. User selects amount and stablecoin type
4. System creates on-ramp session in Firestore
5. User redirected to Paystack for payment
6. User completes payment with NGN
7. Paystack webhook notifies backend
8. Backend processes payment and sends crypto to user's wallet
9. Transaction marked as complete

### Off-Ramp Flow (Sell Crypto)

1. User authenticates with Firebase
2. User connects Flow wallet (with signature verification)
3. User enters bank details and amount
4. System creates off-ramp request with deposit address
5. User sends stablecoins to deposit address
6. Blockchain watcher detects deposit
7. Backend processes withdrawal
8. Fiat sent to user's bank account via Paystack
9. Transaction marked as complete

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
- Check Paystack webhook is properly configured

---

**Built with ❤️ for the Flow blockchain ecosystem**

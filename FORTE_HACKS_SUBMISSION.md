# FlowRamp - Forte Hacks Submission

## 🏆 Hackathon Track: DeFi Actions

**FlowRamp** is a production-ready fiat-to-crypto on/off-ramp for the Flow blockchain, leveraging **Forte's DeFi Actions** to provide seamless, composable financial workflows for emerging markets.

---

## 📋 Project Overview

### Problem Statement
In emerging markets like Nigeria, accessing cryptocurrency remains challenging due to:
- Limited fiat on-ramps
- High transaction fees
- Complex user experiences
- Lack of local payment integration

### Solution
FlowRamp bridges traditional finance with Flow blockchain by:
- **On-Ramp**: Buy Flow stablecoins (fUSDC, fUSDT) using local fiat (NGN) via Paystack
- **Off-Ramp**: Sell stablecoins and receive fiat directly to bank accounts
- **Swap**: Exchange between different Flow tokens using DeFi Actions
- **Non-Custodial**: Users maintain full control of their assets via FCL wallet integration

---

## 🎯 Forte Integration Highlights

### DeFi Actions Implementation

FlowRamp showcases **Forte's composable DeFi primitives** through:

1. **Automated On-Ramp Workflows**
   - Payment verification triggers on-chain actions
   - Automatic token transfer to user wallets
   - Backend signature authorization for security

2. **Multi-Step Off-Ramp Actions**
   - User-initiated token burn/transfer
   - Automated fiat disbursement
   - Transaction status tracking

3. **Swap Integration**
   - Leverages IncrementFi connectors
   - Composable swap actions
   - Real-time quote generation

### Key Cadence Contracts

```
backend/cadence/forte/
├── execute_on_ramp_with_actions.cdc    # On-ramp automation
├── execute_off_ramp_with_actions.cdc   # Off-ramp automation
└── scripts/
    ├── getBalance.cdc                   # Balance queries
    └── hasVault.cdc                     # Vault verification
```

---

## 🏗️ Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Blockchain**: Flow Client Library (FCL)
- **Auth**: Firebase Authentication

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Blockchain**: FCL + Cadence scripts
- **Database**: Firestore
- **Payment**: Paystack integration
- **Security**: Rate limiting, JWT verification, cryptographic signatures

---

## 🚀 Deployed Contracts

### Flow Testnet
- **Network**: Flow Testnet (Devnet)
- **Account**: `0xb30759ba587f6650`
- **Contract**: FlowRamp
- **Explorer**: [View on Flowscan](https://testnet.flowscan.io/account/0xb30759ba587f6650)

### Dependencies
- FungibleToken: `0x9a0766d93b6608b7`
- DeFiActions: `0x4c2ff9dd03ab442f`
- SwapRouter: `0x2f8af5ed05bbde0d`
- IncrementFiSwapConnectors: `0x49bae091e5ea16b5`

---

## 💻 Quick Start

### Prerequisites
- Node.js v18+
- Flow CLI (optional)
- Firebase project
- Paystack account (for NGN payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/AlexD-Great/FlowRamp.git
cd FlowRamp

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Environment Setup

**Frontend (.env)**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend (backend/.env)**
```env
# Flow Configuration
FLOW_NETWORK=testnet
FLOW_ACCOUNT_ADDRESS=0xb30759ba587f6650
FLOW_PRIVATE_KEY=your_private_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_service_account_email

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🎬 Demo Instructions

### 1. User Registration
- Navigate to `/signup`
- Create account with email/password
- Verify email (if enabled)

### 2. On-Ramp Flow
1. Go to `/buy`
2. Enter amount in NGN
3. Select stablecoin (fUSDC/fUSDT)
4. Connect Flow wallet via FCL
5. Complete Paystack payment
6. Tokens automatically transferred to wallet

### 3. Off-Ramp Flow
1. Go to `/sell`
2. Enter token amount
3. Provide bank details
4. Confirm transaction
5. Receive fiat in bank account

### 4. Swap Tokens
1. Go to `/swap`
2. Select token pair
3. View real-time quote
4. Execute swap via DeFi Actions

---

## 🔐 Security Features

### Implemented in This Submission
✅ **Cryptographic Signatures**: Backend authorization using elliptic curve cryptography  
✅ **Rate Limiting**: Protection against abuse (100 req/min general, 10 req/min sensitive ops)  
✅ **JWT Verification**: Firebase Admin SDK for secure authentication  
✅ **Input Validation**: Comprehensive validation on all endpoints  
✅ **Error Handling**: Centralized error handling with proper logging  
✅ **Transaction Retry Logic**: Automatic retry with exponential backoff  
✅ **Non-Custodial**: Users control private keys via FCL  

---

## 📊 Judging Criteria Alignment

### Technology (25%)
- **Forte DeFi Actions**: Core feature using composable workflows
- **Cadence Smart Contracts**: Custom contracts for on/off-ramp automation
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Production-Ready**: Rate limiting, error handling, transaction tracking

### Completion (20%)
- ✅ End-to-end on-ramp flow
- ✅ End-to-end off-ramp flow
- ✅ Token swap functionality
- ✅ User authentication & authorization
- ✅ Transaction history
- ✅ Deployed on Flow Testnet

### Originality (10%)
- **First-to-market**: Nigerian NGN on-ramp for Flow
- **Emerging Markets Focus**: Solving real-world access problems
- **Forte Integration**: Novel use of DeFi Actions for fiat bridges

### User Experience (10%)
- Clean, modern UI with shadcn/ui components
- Intuitive wallet connection via FCL
- Real-time transaction status
- Mobile-responsive design

### Adoption/Practicality (10%)
- **Real Payment Integration**: Paystack for actual NGN transactions
- **Regulatory Consideration**: KYC routes prepared
- **Scalable Architecture**: Separated frontend/backend
- **Market Demand**: 200M+ population in Nigeria

### Protocol Usage (10%)
- Deep Flow ecosystem integration
- Uses multiple Flow protocols (FungibleToken, DeFiActions, SwapRouter)
- Contributes to Flow's emerging markets expansion
- Demonstrates Forte's composability

---

## 🛠️ Technical Improvements (This Branch)

### Security Enhancements
- Replaced mock signatures with real cryptographic signing
- Added comprehensive input validation
- Implemented rate limiting middleware
- Enhanced error handling with custom error classes

### Developer Experience
- Added transaction tracker with retry logic
- Centralized error handling
- Improved logging with emojis for visibility
- Better API response structure

### Code Quality
- TypeScript strict mode
- Async/await error handling with asyncHandler
- Modular architecture
- Comprehensive inline documentation

---

## 📹 Video Demo

**[Link to Video Demo]** _(To be added)_

### Demo Script
1. **Introduction** (30s): Problem statement & solution overview
2. **Architecture** (30s): Show Flow testnet contracts, DeFi Actions integration
3. **On-Ramp Demo** (60s): Live NGN to fUSDC purchase
4. **Off-Ramp Demo** (60s): Sell tokens for NGN
5. **Swap Demo** (30s): Token exchange using DeFi Actions
6. **Code Walkthrough** (60s): Highlight Forte integration points
7. **Conclusion** (30s): Impact & future plans

---

## 🌍 Social Media

**Twitter Post:**
```
🚀 Introducing FlowRamp - The first NGN on/off-ramp for @flow_blockchain!

Built with #ForteHacks DeFi Actions for seamless fiat-to-crypto conversion in Nigeria 🇳🇬

✅ Non-custodial
✅ Paystack integration
✅ Composable workflows
✅ Production-ready

#BuildOnFlow #Web3Africa

[Link to GitHub]
[Link to Demo]
```

---

## 🔮 Future Roadmap

### Phase 1 (Post-Hackathon)
- [ ] Mainnet deployment
- [ ] KYC/AML compliance implementation
- [ ] Multi-currency support (GHS, KES, ZAR)
- [ ] Mobile app (React Native)

### Phase 2
- [ ] Scheduled transactions for recurring purchases
- [ ] DeFi yield integration
- [ ] P2P marketplace
- [ ] Merchant payment gateway

### Phase 3
- [ ] Cross-chain bridges
- [ ] Institutional on-ramp
- [ ] White-label solution for other projects

---

## 👥 Team

**Developer**: [Your Developer's Name]  
**Role**: Full-stack blockchain developer  
**GitHub**: [@AlexD-Great](https://github.com/AlexD-Great)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Flow Foundation** for the Forte network upgrade
- **Paystack** for Nigerian payment infrastructure
- **Firebase** for authentication and database
- **IncrementFi** for swap connectors
- **Forte Hacks** organizers and mentors

---

## 📞 Contact

- **GitHub**: https://github.com/AlexD-Great/FlowRamp
- **Email**: [Your Email]
- **Twitter**: [Your Twitter]
- **Discord**: [Your Discord]

---

**Built with ❤️ for Forte Hacks 2025**

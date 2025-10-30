# FlowRamp - Video Demo Script
## Forte Hacks 2025 Submission

**Total Duration: 5 minutes**

---

## 🎬 Scene 1: Hook & Problem (30 seconds)

### Visual
- Show map of Nigeria with 200M+ population
- Display statistics: "Only 3% crypto adoption in Africa"
- Show frustrated user trying to buy crypto

### Script
> "Nigeria has over 200 million people, but accessing cryptocurrency remains a challenge. High fees, complex processes, and lack of local payment options keep millions locked out of Web3. That's why we built FlowRamp."

---

## 🎬 Scene 2: Solution Overview (30 seconds)

### Visual
- FlowRamp landing page
- Show three main features with icons: Buy, Sell, Swap
- Quick UI tour

### Script
> "FlowRamp is the first fiat-to-crypto on-ramp for Flow blockchain, specifically designed for Nigerian users. Buy Flow stablecoins with Naira, sell them back to your bank account, or swap between tokens - all powered by Forte's DeFi Actions."

---

## 🎬 Scene 3: Architecture & Forte Integration (45 seconds)

### Visual
- Architecture diagram
- Show flow.json with contract addresses
- Highlight Cadence code in VSCode
- Point to DeFi Actions integration

### Script
> "FlowRamp is built on Flow Testnet with a modern architecture. Our Next.js frontend connects to users' Flow wallets via FCL, while our Node.js backend orchestrates Forte's DeFi Actions.

> Here's the magic: When a user completes a Paystack payment, our backend automatically triggers a Cadence transaction using DeFi Actions. This composable workflow handles token transfers, vault setup, and balance updates - all in one atomic operation.

> Our contracts are deployed at address 0xb30759ba587f6650, integrating with Flow's FungibleToken standard and IncrementFi's swap connectors."

---

## 🎬 Scene 4: Live Demo - On-Ramp (90 seconds)

### Visual
- Screen recording of actual on-ramp flow
- Show each step clearly

### Script
> "Let me show you how easy it is to buy crypto with Naira.

> **[Click Buy button]**  
> First, I'll enter 10,000 Naira - that's about $6 USD. I'll select fUSDC as my stablecoin.

> **[Connect wallet]**  
> Next, I connect my Flow wallet using FCL. Notice how smooth this is - no seed phrases to copy, just a simple connection.

> **[Show payment screen]**  
> Now I'm redirected to Paystack, Nigeria's leading payment processor. I can pay with my debit card, bank transfer, or USSD.

> **[Complete payment]**  
> Payment confirmed! Watch what happens next...

> **[Show backend logs]**  
> Our backend receives the webhook, verifies the payment, and triggers a Forte DeFi Action. The action generates a cryptographic signature, executes the Cadence transaction, and transfers fUSDC to my wallet.

> **[Show wallet balance]**  
> And there it is - 10,000 Naira worth of fUSDC in my wallet, ready to use in the Flow ecosystem!"

---

## 🎬 Scene 5: Live Demo - Swap (45 seconds)

### Visual
- Navigate to swap page
- Show token selection
- Display quote
- Execute swap

### Script
> "Now let's swap some tokens using DeFi Actions.

> **[Select tokens]**  
> I'll swap fUSDC for fUSDT. Our integration with IncrementFi's swap connectors provides real-time quotes.

> **[Show quote]**  
> Here's the quote: 1 fUSDC = 0.9998 fUSDT, with minimal slippage.

> **[Execute swap]**  
> I'll confirm the transaction... and done! The DeFi Action composed multiple steps: approve, swap, and update balances - all in one transaction."

---

## 🎬 Scene 6: Code Walkthrough (60 seconds)

### Visual
- Show key code files
- Highlight Forte integration points

### Script
> "Let me show you the code that makes this possible.

> **[Show forte-actions.js]**  
> Here's our Forte Actions service. When executing an on-ramp, we generate a secure signature using elliptic curve cryptography - no more mock signatures!

> **[Show execute_on_ramp_with_actions.cdc]**  
> This Cadence script uses DeFi Actions to compose multiple operations: verify the signature, check vault existence, transfer tokens, and emit events.

> **[Show transaction-tracker.js]**  
> We've added production-ready features like automatic retry logic with exponential backoff, transaction monitoring, and comprehensive error handling.

> **[Show rate-limiter.js]**  
> Security is critical, so we implemented rate limiting: 100 requests per minute for general endpoints, 10 for sensitive operations.

> **[Show error-handler.js]**  
> And centralized error handling with custom error classes for better debugging and user feedback."

---

## 🎬 Scene 7: Impact & Metrics (30 seconds)

### Visual
- Show transaction history page
- Display metrics dashboard
- Show testnet explorer

### Script
> "FlowRamp is already processing transactions on Flow Testnet. Users can view their complete transaction history, track status in real-time, and verify everything on-chain.

> This isn't just a hackathon project - it's a production-ready solution addressing real market needs in Africa."

---

## 🎬 Scene 8: Future Vision (30 seconds)

### Visual
- Roadmap graphic
- Map showing expansion to other African countries
- Mobile app mockup

### Script
> "Our roadmap includes mainnet deployment, KYC compliance, expansion to other African currencies like Kenyan Shillings and South African Rand, and a mobile app.

> We're also exploring scheduled transactions for recurring purchases, DeFi yield integration, and a white-label solution for other projects."

---

## 🎬 Scene 9: Closing & Call to Action (30 seconds)

### Visual
- GitHub repo
- Twitter post
- Flow logo + Forte Hacks logo

### Script
> "FlowRamp demonstrates the power of Forte's composable DeFi Actions to solve real-world problems. By bridging traditional finance with Flow blockchain, we're opening Web3 to millions of users in emerging markets.

> Check out our GitHub repo, try the live demo on testnet, and follow our journey on Twitter. Thank you to the Flow Foundation, Forte Hacks organizers, and the amazing Flow community.

> Let's build the future of finance - together!"

---

## 📋 Recording Checklist

### Before Recording
- [ ] Test all features on testnet
- [ ] Prepare test accounts with funds
- [ ] Clear browser cache/cookies
- [ ] Close unnecessary tabs/apps
- [ ] Set up screen recording (1080p minimum)
- [ ] Test microphone audio
- [ ] Prepare backup recordings

### During Recording
- [ ] Speak clearly and at moderate pace
- [ ] Show mouse cursor for clarity
- [ ] Pause between sections
- [ ] Zoom in on important code/UI elements
- [ ] Keep each take under 30 seconds for easy editing

### After Recording
- [ ] Edit out mistakes/pauses
- [ ] Add background music (low volume)
- [ ] Add text overlays for key points
- [ ] Include GitHub/Twitter links as overlays
- [ ] Add Flow/Forte Hacks branding
- [ ] Export in 1080p MP4
- [ ] Upload to YouTube (unlisted)
- [ ] Test playback on different devices

---

## 🎨 Visual Assets Needed

1. **Intro Slide**
   - FlowRamp logo
   - Tagline: "Bridging Naira to Flow Blockchain"
   - Forte Hacks 2025 badge

2. **Architecture Diagram**
   - Frontend (Next.js) → Backend (Express) → Flow Blockchain
   - Show DeFi Actions integration
   - Highlight Paystack connection

3. **Code Highlights**
   - Syntax-highlighted code snippets
   - Annotations pointing to key features

4. **Metrics Dashboard**
   - Transaction count
   - Total volume
   - User count
   - Success rate

5. **Roadmap Graphic**
   - Timeline with milestones
   - Geographic expansion map

6. **Closing Slide**
   - GitHub: github.com/AlexD-Great/FlowRamp
   - Twitter: @YourHandle
   - "Built with ❤️ for Forte Hacks 2025"

---

## 🎵 Suggested Background Music

- Upbeat, modern electronic music
- 80-100 BPM
- No lyrics
- Royalty-free (YouTube Audio Library)
- Volume: 15-20% of narration

**Suggested Tracks:**
- "Inspiring Technology" by AudioCoffee
- "Uplifting Corporate" by Infraction
- "Tech Innovation" by Soundroll

---

## 📤 Upload Instructions

### YouTube
1. Title: "FlowRamp - Fiat On-Ramp for Flow Blockchain | Forte Hacks 2025"
2. Description: Include GitHub link, tech stack, contract address
3. Tags: Flow, Blockchain, DeFi, Forte, Nigeria, Crypto, On-Ramp
4. Thumbnail: Custom with FlowRamp logo + "Forte Hacks 2025"
5. Visibility: Unlisted (share link in submission)

### Submission Platform
1. Paste YouTube link
2. Include timestamp breakdown
3. Add note: "Full source code available on GitHub"

---

**Good luck with your demo! 🚀**

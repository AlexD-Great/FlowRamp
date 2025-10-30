# Quick Start: Find Labs API Integration (2 hours)

## 🎯 Goal
Integrate Find Labs Data API into FlowRamp to qualify for the **$1,000 Find Labs bounty**.

---

## ⚡ Step-by-Step (2 hours)

### Step 1: Get API Key (5 min)

1. Go to https://flowscan.notion.site/Find-Labs-Forte-Hacks-285873cae2b680918231f4dea2ac0582
2. Click "Get FREE API Key"
3. Fill out the form
4. Copy your API key

### Step 2: Add to Environment (2 min)

Add to `backend/.env`:
```env
# Find Labs API
FIND_LABS_API_KEY=your_api_key_here
FIND_LABS_BASE_URL=https://api.findlabs.io/v1
```

### Step 3: Test the Client (5 min)

The client is already written! Test it:

```bash
cd backend
node -e "
const {FindLabsClient} = require('./lib/find-labs-client');
const client = new FindLabsClient();
console.log('✅ Find Labs client initialized');
"
```

### Step 4: Integrate into Transaction Tracker (30 min)

Update `backend/lib/transaction-tracker.js`:

```javascript
const { FindLabsClient } = require('./find-labs-client');

class TransactionTracker {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 5000;
    this.findLabs = new FindLabsClient(); // Add this
  }

  /**
   * Monitor transaction using Find Labs API
   */
  async monitorTransactionWithFindLabs(txHash, timeout = 60000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      this.findLabs.monitorTransaction(
        txHash,
        (status) => {
          console.log(`🔍 Transaction ${txHash} status:`, status.status);
          
          if (status.status === 'sealed') {
            resolve({
              success: true,
              status: 'sealed',
              blockHeight: status.blockHeight,
              timestamp: status.timestamp,
              events: status.events
            });
          } else if (status.status === 'failed') {
            reject(new Error('Transaction failed on-chain'));
          }
        },
        30 // max attempts
      ).catch(reject);
      
      // Timeout fallback
      setTimeout(() => {
        reject(new Error('Transaction monitoring timeout'));
      }, timeout);
    });
  }
}
```

### Step 5: Add Real-Time Status Endpoint (20 min)

Create `backend/routes/transaction-status.js`:

```javascript
const express = require('express');
const router = express.Router();
const { FindLabsClient } = require('../lib/find-labs-client');
const { asyncHandler } = require('../lib/error-handler');
const { protect } = require('../lib/auth');

const findLabs = new FindLabsClient();

/**
 * @route   GET /api/transaction/:txHash
 * @desc    Get real-time transaction status from Find Labs
 * @access  Public
 */
router.get('/:txHash', asyncHandler(async (req, res) => {
  const { txHash } = req.params;
  
  const transaction = await findLabs.getTransaction(txHash);
  const events = await findLabs.getTransactionEvents(txHash);
  
  res.json({
    success: true,
    transaction: {
      hash: txHash,
      status: transaction.status,
      blockHeight: transaction.block_height,
      timestamp: transaction.timestamp,
      gasUsed: transaction.gas_used,
      events: events
    }
  });
}));

/**
 * @route   GET /api/transaction/:txHash/events
 * @desc    Get events for a specific transaction
 * @access  Public
 */
router.get('/:txHash/events', asyncHandler(async (req, res) => {
  const { txHash } = req.params;
  
  const events = await findLabs.getTransactionEvents(txHash);
  
  res.json({
    success: true,
    count: events.length,
    events
  });
}));

/**
 * @route   GET /api/analytics/onramp-events
 * @desc    Get FlowRamp on-ramp events
 * @access  Private
 */
router.get('/analytics/onramp-events', protect, asyncHandler(async (req, res) => {
  const { fromBlock, toBlock } = req.query;
  
  const events = await findLabs.getFlowRampOnRampEvents(
    fromBlock || 'latest-1000',
    toBlock || 'latest'
  );
  
  res.json({
    success: true,
    count: events.length,
    events
  });
}));

module.exports = router;
```

### Step 6: Register Route in Server (5 min)

Update `backend/server.js`:

```javascript
// Add at top with other routes
const transactionRoutes = require("./routes/transaction-status");

// Add with other route registrations
app.use("/api/transaction", transactionRoutes);
```

### Step 7: Add Frontend Display (30 min)

Create `components/TransactionStatus.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface TransactionStatusProps {
  txHash: string;
}

export function TransactionStatus({ txHash }: TransactionStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaction/${txHash}`
        );
        const data = await response.json();
        setStatus(data.transaction);
      } catch (error) {
        console.error('Error fetching transaction status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Poll every 3 seconds if pending
    const interval = setInterval(() => {
      if (status?.status !== 'sealed' && status?.status !== 'failed') {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [txHash, status?.status]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading transaction status...</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'sealed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status?.status) {
      case 'sealed':
        return <Badge variant="success">Sealed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Transaction Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Transaction Hash</span>
          <code className="text-xs">{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
        </div>

        {status?.blockHeight && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Block Height</span>
            <span className="text-sm font-mono">{status.blockHeight}</span>
          </div>
        )}

        {status?.timestamp && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Timestamp</span>
            <span className="text-sm">{new Date(status.timestamp).toLocaleString()}</span>
          </div>
        )}

        {status?.events && status.events.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Events ({status.events.length})</h4>
            <div className="space-y-2">
              {status.events.map((event: any, i: number) => (
                <div key={i} className="text-xs p-2 bg-muted rounded">
                  <div className="font-mono">{event.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <a
            href={`https://testnet.flowscan.io/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View on Flowscan →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 8: Use in Transaction History (15 min)

Update your transaction history page to use the new component:

```typescript
import { TransactionStatus } from '@/components/TransactionStatus';

// In your transaction list
{transactions.map((tx) => (
  <div key={tx.id}>
    <TransactionStatus txHash={tx.txHash} />
  </div>
))}
```

### Step 9: Update README (5 min)

Add to `README.md`:

```markdown
## 🔍 Real-Time Transaction Tracking

FlowRamp uses Find Labs Data API for real-time blockchain data:

- **Live transaction monitoring** - See status updates in real-time
- **Block confirmations** - Track when transactions are sealed
- **Event tracking** - View all on-chain events
- **Historical data** - Query past transactions and events

Powered by [Find Labs](https://findlabs.io) for reliable Flow blockchain data.
```

### Step 10: Test Everything (10 min)

```bash
# Start backend
cd backend
npm run dev

# Test transaction endpoint
curl http://localhost:3001/api/transaction/YOUR_TX_HASH

# Test events endpoint
curl http://localhost:3001/api/transaction/YOUR_TX_HASH/events

# Start frontend and verify UI updates
cd ..
npm run dev
```

---

## 🎯 Bounty Requirements Checklist

- [ ] Find Labs API key obtained
- [ ] API integrated into backend
- [ ] Real-time transaction monitoring implemented
- [ ] Frontend displays live status
- [ ] Events are tracked and displayed
- [ ] Documentation updated in README
- [ ] Integration shown in video demo

---

## 💡 Advanced Features (Optional)

### Add Staking Rewards Display

```javascript
// In a new route or component
router.get('/staking/rewards/:address', asyncHandler(async (req, res) => {
  const { address } = req.params;
  const rewards = await findLabs.getDelegatedStakingRewards(address);
  
  res.json({
    success: true,
    rewards
  });
}));
```

### Add Block Explorer

```javascript
router.get('/block/:height', asyncHandler(async (req, res) => {
  const { height } = req.params;
  const block = await findLabs.getBlock(height);
  
  res.json({
    success: true,
    block
  });
}));
```

### Add Event Stream

```javascript
// Real-time event streaming
router.get('/events/stream', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(async () => {
    const events = await findLabs.getFlowRampOnRampEvents('latest-10', 'latest');
    res.write(`data: ${JSON.stringify(events)}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
}));
```

---

## 🎬 For Video Demo

Show the real-time transaction monitoring:

> "FlowRamp integrates Find Labs Data API for real-time blockchain transparency. Watch as this transaction updates live - you can see the exact block height, timestamp, and all emitted events. This gives users complete confidence in their transactions."

**[Show TransactionStatus component updating in real-time]**

---

## 📚 Resources

- **Get API Key**: https://flowscan.notion.site/Find-Labs-Forte-Hacks-285873cae2b680918231f4dea2ac0582
- **Find Labs Docs**: https://docs.findlabs.io
- **Flow Events**: https://developers.flow.com/build/basics/events

---

## 🚨 Troubleshooting

### "API key not working"
- Check `.env` file has correct key
- Restart backend server
- Verify key is not expired

### "No data returned"
- Check transaction hash is valid
- Verify it's on the correct network (testnet/mainnet)
- Try with a recent transaction

### "CORS errors"
- Find Labs API should support CORS
- If not, proxy through your backend (already done!)

---

## 💰 Bounty Value

**Prize**: $1,000  
**Time**: 2 hours  
**Difficulty**: Medium  
**ROI**: Good 💰

---

## ✅ After Completion

1. **Test all endpoints**: Verify API responses
2. **Test frontend**: Check real-time updates work
3. **Update README**: Document the integration
4. **Screenshot**: Take screenshots for submission
5. **Video demo**: Show live transaction tracking

---

**This integration makes FlowRamp more transparent and user-friendly!** 🔍

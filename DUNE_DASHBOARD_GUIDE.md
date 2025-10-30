# FlowRamp Dune Analytics Dashboard Guide

## Quick Setup (30 minutes)

### Step 1: Create Dune Account
1. Go to https://dune.com
2. Sign up with GitHub
3. Create new dashboard

### Step 2: Key Queries to Create

#### Query 1: Total On-Ramp Volume
```sql
SELECT 
    DATE_TRUNC('day', block_timestamp) as date,
    COUNT(*) as transaction_count,
    SUM(CAST(amount AS DOUBLE)) as total_volume_usd
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
    AND event_name LIKE '%OnRampCompleted%'
GROUP BY 1
ORDER BY 1 DESC
```

#### Query 2: Unique Users
```sql
SELECT 
    COUNT(DISTINCT user_address) as unique_users,
    DATE_TRUNC('week', block_timestamp) as week
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
GROUP BY 2
ORDER BY 2 DESC
```

#### Query 3: Stablecoin Preference
```sql
SELECT 
    stablecoin_type,
    COUNT(*) as transactions,
    SUM(amount) as total_volume
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
    AND event_name = 'OnRampCompleted'
GROUP BY 1
```

#### Query 4: Average Transaction Size
```sql
SELECT 
    AVG(CAST(amount AS DOUBLE)) as avg_transaction_usd,
    DATE_TRUNC('day', block_timestamp) as date
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
GROUP BY 2
ORDER BY 2 DESC
```

#### Query 5: Success Rate
```sql
SELECT 
    DATE_TRUNC('day', block_timestamp) as date,
    COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM flow.cadence_transactions
WHERE signer = '0xb30759ba587f6650'
GROUP BY 1
ORDER BY 1 DESC
```

### Step 3: Create Visualizations
1. **Line Chart**: Total volume over time
2. **Counter**: Total unique users
3. **Pie Chart**: fUSDC vs fUSDT distribution
4. **Bar Chart**: Daily transaction count
5. **Line Chart**: Success rate trend

### Step 4: Dashboard Layout
```
┌─────────────────────────────────────────┐
│  FlowRamp Analytics - Nigerian On-Ramp │
├─────────────────────────────────────────┤
│  Total Volume    │  Unique Users        │
│  $XXX,XXX        │  XXX users           │
├─────────────────────────────────────────┤
│  Volume Over Time (Line Chart)          │
├─────────────────────────────────────────┤
│  Stablecoin     │  Daily Transactions   │
│  Distribution   │  (Bar Chart)          │
│  (Pie Chart)    │                       │
├─────────────────────────────────────────┤
│  Success Rate Trend (Line Chart)        │
└─────────────────────────────────────────┘
```

### Step 5: Add to README
```markdown
## 📊 Analytics Dashboard

View real-time FlowRamp metrics on our [Dune Dashboard](https://dune.com/your-username/flowramp)

- Total transaction volume
- Unique users
- Stablecoin preferences
- Success rates
```

## Resources
- Dune Tutorial: https://www.youtube.com/watch?v=v5X_5NnX8O0
- Flow Cadence Tables: https://dune.com/docs/data-tables/flow/
- Example Dashboards: https://dune.com/browse/dashboards

## Bounty Eligibility
✅ Existing project on testnet  
✅ Meaningful dashboard for project  
✅ Link in GitHub README  
✅ Eligible for $10,000 split bounty  

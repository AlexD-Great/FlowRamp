# Quick Start: Dune Dashboard (30 minutes)

## 🎯 Goal
Create a Dune Analytics dashboard for FlowRamp to qualify for the **$10,000 Dune Analytics bounty**.

---

## ⚡ Step-by-Step (30 minutes)

### Step 1: Create Dune Account (5 min)
1. Go to https://dune.com
2. Click "Sign up" → Use GitHub
3. Verify email

### Step 2: Create Dashboard (2 min)
1. Click "+ New" → "Dashboard"
2. Name it: "FlowRamp - Nigerian Fiat On-Ramp Analytics"
3. Description: "Real-time analytics for FlowRamp, the first NGN to Flow stablecoin on-ramp"

### Step 3: Add Queries (15 min)

Click "+ Add Visualization" → "New Query" for each:

#### Query 1: Total Volume & Transactions
```sql
-- FlowRamp: Total Volume Over Time
SELECT 
    DATE_TRUNC('day', block_timestamp) as date,
    COUNT(*) as transaction_count,
    SUM(CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DOUBLE)) as total_volume_usd
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
    AND event_name LIKE '%OnRamp%'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 90
```
**Visualization**: Line chart (X: date, Y: total_volume_usd)

---

#### Query 2: Unique Users
```sql
-- FlowRamp: Unique Users Growth
SELECT 
    DATE_TRUNC('week', block_timestamp) as week,
    COUNT(DISTINCT JSON_EXTRACT_SCALAR(event_data, '$.beneficiary')) as unique_users
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
    AND event_name LIKE '%OnRamp%'
GROUP BY 1
ORDER BY 1 DESC
```
**Visualization**: Counter (show latest value) + Line chart

---

#### Query 3: Stablecoin Distribution
```sql
-- FlowRamp: Stablecoin Preference
SELECT 
    JSON_EXTRACT_SCALAR(event_data, '$.stablecoin') as stablecoin,
    COUNT(*) as transactions,
    SUM(CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DOUBLE)) as total_volume
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
    AND event_name LIKE '%OnRamp%'
GROUP BY 1
```
**Visualization**: Pie chart

---

#### Query 4: Daily Transaction Count
```sql
-- FlowRamp: Daily Transactions
SELECT 
    DATE_TRUNC('day', block_timestamp) as date,
    COUNT(*) as transactions
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
    AND event_name LIKE '%OnRamp%'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 30
```
**Visualization**: Bar chart

---

#### Query 5: Success Rate
```sql
-- FlowRamp: Transaction Success Rate
SELECT 
    DATE_TRUNC('day', block_timestamp) as date,
    COUNT(CASE WHEN status = 'sealed' THEN 1 END) * 100.0 / COUNT(*) as success_rate,
    COUNT(*) as total_transactions
FROM flow.cadence_transactions
WHERE signer = '0xb30759ba587f6650'
GROUP BY 1
ORDER BY 1 DESC
LIMIT 30
```
**Visualization**: Line chart with success_rate

---

### Step 4: Arrange Dashboard (5 min)

Layout suggestion:
```
┌─────────────────────────────────────────────────────┐
│  FlowRamp Analytics - Nigerian Fiat On-Ramp         │
├──────────────────────┬──────────────────────────────┤
│  Total Volume        │  Unique Users                │
│  [Counter]           │  [Counter]                   │
├──────────────────────┴──────────────────────────────┤
│  Volume Over Time                                   │
│  [Line Chart - Query 1]                             │
├──────────────────────┬──────────────────────────────┤
│  Stablecoin Split    │  Daily Transactions          │
│  [Pie Chart - Q3]    │  [Bar Chart - Query 4]       │
├──────────────────────┴──────────────────────────────┤
│  Success Rate Trend                                 │
│  [Line Chart - Query 5]                             │
└─────────────────────────────────────────────────────┘
```

### Step 5: Make Public & Get Link (2 min)
1. Click "Settings" (top right)
2. Toggle "Public dashboard" ON
3. Copy the URL (e.g., https://dune.com/yourname/flowramp)

### Step 6: Update README (1 min)
Add this section to `README.md`:

```markdown
## 📊 Analytics Dashboard

Track FlowRamp's real-time metrics on our [Dune Analytics Dashboard](https://dune.com/yourname/flowramp):

- 📈 Total transaction volume
- 👥 Unique users
- 💰 Stablecoin preferences (fUSDC vs fUSDT)
- ✅ Transaction success rates
- 📅 Daily activity trends

All data is publicly verifiable on-chain via Flow blockchain.
```

---

## 🎯 Bounty Requirements Checklist

- [ ] Dashboard created on Dune
- [ ] At least 5 meaningful queries
- [ ] Visualizations are clear and useful
- [ ] Dashboard is public
- [ ] Link added to README.md
- [ ] Dashboard shows FlowRamp-specific data
- [ ] Relevant to the project (not just generic Flow stats)

---

## 💡 Tips for Better Dashboard

### Add Context
- Add text boxes explaining what each chart shows
- Include project description at the top
- Add links to GitHub and website

### Make it Pretty
- Use consistent colors (Flow blue: #00EF8B)
- Add emojis to titles
- Group related charts together

### Add More Insights
```sql
-- Average Transaction Size
SELECT AVG(CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DOUBLE)) as avg_usd
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'

-- Peak Usage Hours
SELECT 
    EXTRACT(HOUR FROM block_timestamp) as hour,
    COUNT(*) as transactions
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
GROUP BY 1
ORDER BY 2 DESC

-- Top Users by Volume
SELECT 
    JSON_EXTRACT_SCALAR(event_data, '$.beneficiary') as user,
    COUNT(*) as transactions,
    SUM(CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DOUBLE)) as total_volume
FROM flow.cadence_events
WHERE contract_address = '0xb30759ba587f6650'
GROUP BY 1
ORDER BY 3 DESC
LIMIT 10
```

---

## 🚨 Troubleshooting

### "No data found"
- Check contract address is correct: `0xb30759ba587f6650`
- Verify events have been emitted on testnet
- Try broader date range
- Check event name format

### "Query timeout"
- Add `LIMIT` clause
- Reduce date range
- Simplify aggregations

### "JSON_EXTRACT_SCALAR returns null"
- Check event structure in Flow explorer
- Verify field names match your contract
- Use `event_data` column for Cadence events

---

## 📚 Resources

- **Dune Tutorial**: https://www.youtube.com/watch?v=v5X_5NnX8O0
- **Flow Cadence Tables**: https://dune.com/docs/data-tables/flow/
- **Example Dashboards**: https://dune.com/browse/dashboards?tags=flow
- **SQL Reference**: https://dune.com/docs/query/

---

## ✅ After Completion

1. **Test the dashboard**: Click through all visualizations
2. **Share the link**: Post on Twitter with #ForteHacks
3. **Add to submission**: Include dashboard URL in HackQuest submission
4. **Screenshot**: Take screenshots for video demo

---

## 🎬 For Video Demo

Show the dashboard and say:

> "To ensure complete transparency, we've built a comprehensive Dune Analytics dashboard. Anyone can verify our transaction volume, user growth, and success rates directly on-chain. This level of data transparency is crucial for building trust in emerging markets like Nigeria."

**[Show dashboard for 10-15 seconds, scroll through charts]**

---

## 💰 Bounty Value

**Prize**: $10,000 (split among all qualifying projects)  
**Time**: 30 minutes  
**Difficulty**: Easy  
**ROI**: Excellent 🚀

---

**Good luck! This should take about 30 minutes total.** ⏱️

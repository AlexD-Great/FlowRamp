const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to rates data file
const RATES_FILE = path.join(__dirname, '..', 'data', 'rates.json');

// Initialize default rates if file doesn't exist
const initializeRates = async () => {
  try {
    await fs.access(RATES_FILE);
  } catch (error) {
    // File doesn't exist, create with default rates
    const defaultRates = {
      buyRate: 750,
      sellRate: 730,
      lastUpdated: new Date().toISOString()
    };
    await fs.mkdir(path.dirname(RATES_FILE), { recursive: true });
    await fs.writeFile(RATES_FILE, JSON.stringify(defaultRates, null, 2));
  }
};

// GET current rates
router.get('/', async (req, res) => {
  try {
    await initializeRates();
    const ratesData = await fs.readFile(RATES_FILE, 'utf8');
    const rates = JSON.parse(ratesData);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// PUT update rates
router.put('/', async (req, res) => {
  try {
    const { buyRate, sellRate } = req.body;
    
    // Validate input
    if (typeof buyRate !== 'number' || typeof sellRate !== 'number') {
      return res.status(400).json({ error: 'Rates must be numbers' });
    }
    
    if (buyRate <= 0 || sellRate <= 0) {
      return res.status(400).json({ error: 'Rates must be greater than 0' });
    }

    await initializeRates();
    
    // Read current rates
    const ratesData = await fs.readFile(RATES_FILE, 'utf8');
    const currentRates = JSON.parse(ratesData);
    
    // Update rates
    const updatedRates = {
      ...currentRates,
      buyRate,
      sellRate,
      lastUpdated: new Date().toISOString()
    };
    
    // Save updated rates
    await fs.writeFile(RATES_FILE, JSON.stringify(updatedRates, null, 2));
    
    res.json(updatedRates);
  } catch (error) {
    console.error('Error updating rates:', error);
    res.status(500).json({ error: 'Failed to update rates' });
  }
});

module.exports = router;

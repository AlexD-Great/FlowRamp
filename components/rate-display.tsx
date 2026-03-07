"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface RateData {
  buyRate: number;
  sellRate: number;
  lastUpdated: string;
}

export default function RateDisplay() {
  const [rates, setRates] = useState<RateData>({
    buyRate: 0,
    sellRate: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [previousRates, setPreviousRates] = useState<RateData | null>(null);

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        setPreviousRates(rates);
        setRates(data);
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every 30 seconds
    const interval = setInterval(fetchRates, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getRateChange = (current: number, previous: number | null) => {
    if (previous === null || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const buyRateChange = previousRates ? getRateChange(rates.buyRate, previousRates.buyRate) : null;
  const sellRateChange = previousRates ? getRateChange(rates.sellRate, previousRates.sellRate) : null;

  if (loading) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading rates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">BUY</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">₦{rates.buyRate.toLocaleString()}</span>
              {buyRateChange !== null && (
                <div className={`flex items-center gap-1 ${buyRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {buyRateChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {Math.abs(buyRateChange).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">SELL</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">₦{rates.sellRate.toLocaleString()}</span>
              {sellRateChange !== null && (
                <div className={`flex items-center gap-1 ${sellRateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sellRateChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {Math.abs(sellRateChange).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground border-t border-border pt-1">
          Updated: {new Date(rates.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

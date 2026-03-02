"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface RateData {
  buyRate: number;
  sellRate: number;
  lastUpdated: string;
}

export default function RateManager() {
  const [rates, setRates] = useState<RateData>({
    buyRate: 0,
    sellRate: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [newRates, setNewRates] = useState({
    buyRate: "",
    sellRate: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previousRates, setPreviousRates] = useState<RateData | null>(null);

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        setPreviousRates(rates);
        setRates(data);
        setNewRates({
          buyRate: data.buyRate.toString(),
          sellRate: data.sellRate.toString(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
      setMessage({ type: "error", text: "Failed to fetch current rates" });
    } finally {
      setLoading(false);
    }
  };

  const updateRates = async () => {
    const buyRate = parseFloat(newRates.buyRate);
    const sellRate = parseFloat(newRates.sellRate);

    if (isNaN(buyRate) || isNaN(sellRate)) {
      setMessage({ type: "error", text: "Please enter valid numbers for both rates" });
      return;
    }

    if (buyRate <= 0 || sellRate <= 0) {
      setMessage({ type: "error", text: "Rates must be greater than 0" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/rates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buyRate, sellRate }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviousRates(rates);
        setRates(data);
        setMessage({ type: "success", text: "Rates updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update rates" });
      }
    } catch (error) {
      console.error("Failed to update rates:", error);
      setMessage({ type: "error", text: "Failed to update rates" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getRateChange = (current: number, previous: number | null) => {
    if (previous === null || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const buyRateChange = previousRates ? getRateChange(rates.buyRate, previousRates.buyRate) : null;
  const sellRateChange = previousRates ? getRateChange(rates.sellRate, previousRates.sellRate) : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate Management</CardTitle>
          <CardDescription>Update Flow token buy and sell rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading rates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Rate Management
        </CardTitle>
        <CardDescription>
          Update Flow token buy and sell rates for Nigerian Naira
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Current Rates Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Current Buy Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">₦{rates.buyRate.toLocaleString()}</span>
              {buyRateChange !== null && (
                <Badge variant={buyRateChange >= 0 ? "default" : "destructive"} className="text-xs">
                  {buyRateChange >= 0 ? "+" : ""}{buyRateChange.toFixed(2)}%
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Current Sell Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">₦{rates.sellRate.toLocaleString()}</span>
              {sellRateChange !== null && (
                <Badge variant={sellRateChange >= 0 ? "default" : "destructive"} className="text-xs">
                  {sellRateChange >= 0 ? "+" : ""}{sellRateChange.toFixed(2)}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="space-y-4 border-t border-border pt-4">
          <h3 className="text-lg font-semibold">Update Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyRate">New Buy Rate (₦)</Label>
              <Input
                id="buyRate"
                type="number"
                placeholder="Enter buy rate"
                value={newRates.buyRate}
                onChange={(e) => setNewRates({ ...newRates, buyRate: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellRate">New Sell Rate (₦)</Label>
              <Input
                id="sellRate"
                type="number"
                placeholder="Enter sell rate"
                value={newRates.sellRate}
                onChange={(e) => setNewRates({ ...newRates, sellRate: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={updateRates} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Updating..." : "Update Rates"}
            </Button>
            <Button variant="outline" onClick={fetchRates} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Last Updated Info */}
        <div className="text-sm text-muted-foreground border-t border-border pt-2">
          Last updated: {new Date(rates.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

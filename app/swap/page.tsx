"use client"

import { useState } from "react"
import * as fcl from "@onflow/fcl"
import * as t from "@onflow/types"

// Configure FCL
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org", // Testnet
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", // Testnet
});

export default function SwapPage() {
  const [fromToken, setFromToken] = useState("FLOW");
  const [toToken, setToToken] = useState("FUSD");
  const [fromAmount, setFromAmount] = useState("");
  const [quote, setQuote] = useState<number | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getQuote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/swap/quote?fromToken=${fromToken}&toToken=${toToken}&fromAmount=${fromAmount}`
      );
      const data = await response.json();
      setQuote(data.amountOut);
    } catch (error) {
      console.error("Error getting quote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async () => {
    setIsLoading(true);
    setTxStatus("Initializing...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/swap/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromToken,
          toToken,
          fromAmount,
          minAmountOut: quote ? (quote * 0.95).toFixed(8) : "0.0", // 5% slippage tolerance
        }),
      });
      const data = await response.json();

      const transactionId = await fcl.mutate({
        cadence: data.cadence,
        args: (arg, t) => data.args.map(([value, type]) => arg(value, t[type])),
        limit: 9999,
      });

      setTxId(transactionId);
      setTxStatus("Transaction sent, waiting for sealing...");

      fcl.tx(transactionId).subscribe((res) => {
        setTxStatus(`Status: ${res.statusString}`);
        if (res.status === 4) { // 4 is the status for a sealed transaction
          setIsLoading(false);
          setTxStatus("Transaction sealed!");
        }
      });
    } catch (error) {
      console.error("Error executing swap:", error);
      setIsLoading(false);
      setTxStatus("Error executing swap.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Swap Tokens</h1>
        <p className="text-lg text-muted-foreground">Exchange tokens seamlessly on the Flow blockchain.</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label htmlFor="fromAmount" className="block text-sm font-medium text-gray-700">
            From Amount
          </label>
          <input
            type="text"
            id="fromAmount"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <button
          onClick={getQuote}
          disabled={isLoading || !fromAmount}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Getting Quote..." : "Get Quote"}
        </button>

        {quote && (
          <div className="text-center">
            <p>You will receive approximately: {quote.toFixed(4)} {toToken}</p>
          </div>
        )}

        <button
          onClick={executeSwap}
          disabled={isLoading || !quote}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? "Executing Swap..." : "Execute Swap"}
        </button>

        {txStatus && (
          <div className="text-center">
            <p>{txStatus}</p>
            {txId && (
              <a
                href={`https://testnet.flowscan.io/transaction/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-900"
              >
                View on Flowscan
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// This script gets a quote for a swap from a DEX
// It uses the SwapConnectors contract to find the best quote

import "SwapConnectors"

access(all) fun main(
    fromToken: String,
    toToken: String,
    fromAmount: UFix64
): UFix64 {
    let quote = SwapConnectors.getQuote(
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: fromAmount
    )
    return quote.amountOut
}

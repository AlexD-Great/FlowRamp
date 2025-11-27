import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Zap, Shield, Globe, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              Powered by Flow Blockchain
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
              Your Gateway to Flow Stablecoins
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Buy and sell Flow stablecoins with Nigerian Naira. Fast, secure, and transparent on-chain transactions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg h-12 px-8" id="hero-cta-buy">
                <Link href="/buy">
                  Buy Stablecoins
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg h-12 px-8 bg-transparent" id="hero-cta-sell">
                <Link href="/sell">Sell Stablecoins</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose FlowRamp?</h2>
            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              Built on Flow blockchain with Forte Actions for secure, transparent transactions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Transactions complete in seconds with Flow blockchain's high throughput
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Transparent</CardTitle>
                <CardDescription>
                  Every transaction is recorded on-chain with verifiable receipts and proof
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Local Payment Methods</CardTitle>
                <CardDescription>Pay with bank transfer, card, or mobile money in Nigerian Naira</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* On-Ramp */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <ArrowUpRight className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl">On-Ramp (Buy)</CardTitle>
                </div>
                <CardDescription className="text-base">Convert NGN to Flow stablecoins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Enter Amount & Wallet</p>
                    <p className="text-sm text-muted-foreground">Specify how much NGN you want to convert</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Complete Payment</p>
                    <p className="text-sm text-muted-foreground">Pay with your preferred method</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Receive Stablecoins</p>
                    <p className="text-sm text-muted-foreground">Tokens delivered to your wallet instantly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Off-Ramp */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-amber-500/10 p-2">
                    <ArrowDownRight className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-2xl">Off-Ramp (Sell)</CardTitle>
                </div>
                <CardDescription className="text-base">Convert Flow stablecoins to NGN</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Request Withdrawal</p>
                    <p className="text-sm text-muted-foreground">Enter amount and payout details</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Send Stablecoins</p>
                    <p className="text-sm text-muted-foreground">Transfer tokens to our deposit address</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Receive NGN</p>
                    <p className="text-sm text-muted-foreground">Get paid directly to your bank account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-balance max-w-2xl mx-auto opacity-90">
            Join thousands of users converting between NGN and Flow stablecoins
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg h-12 px-8">
            <Link href="/buy">
              Start Trading Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

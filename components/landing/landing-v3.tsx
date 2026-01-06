"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, ArrowDownLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

// Minimal animated orb
function MinimalOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// Subtle grid background
function GridBackground() {
  return (
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// Animated text reveal
function AnimatedText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      className={`inline-block transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </span>
  );
}

// Minimal feature item
function FeatureItem({ title, description, delay }: { title: string; description: string; delay: number }) {
  return (
    <div
      className="group py-8 border-t border-border/30 hover:border-primary/30 transition-colors animate-[fadeInUp_0.8s_ease-out]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          <h3 className="text-2xl font-light mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground font-light">{description}</p>
        </div>
        <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}

// Minimal process step
function ProcessStep({ from, to, description, direction }: { from: string; to: string; description: string; direction: "up" | "down" }) {
  const Icon = direction === "up" ? ArrowUpRight : ArrowDownLeft;
  return (
    <div className="group relative p-8 bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl hover:border-primary/30 hover:bg-card/50 transition-all duration-500">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl ${direction === "up" ? "bg-green-500/10" : "bg-amber-500/10"}`}>
          <Icon className={`h-6 w-6 ${direction === "up" ? "text-green-500" : "text-amber-500"}`} />
        </div>
        <div className="flex items-center gap-3 text-xl font-light">
          <span>{from}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span>{to}</span>
        </div>
      </div>
      <p className="text-muted-foreground font-light">{description}</p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Transaction animation
function TransactionFlow() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-40 flex items-center justify-center gap-8">
      {/* NGN */}
      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          step >= 1 ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-2">
          <span className="text-2xl font-light text-green-500">N</span>
        </div>
        <span className="text-sm text-muted-foreground">NGN</span>
      </div>

      {/* Arrow with animation */}
      <div className="relative w-32">
        <div className="h-px bg-gradient-to-r from-green-500/50 via-primary to-blue-500/50" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary transition-all duration-500"
          style={{ left: `${step * 33}%` }}
        />
      </div>

      {/* fUSDC */}
      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          step >= 3 ? "opacity-100 scale-100" : "opacity-50 scale-95"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-2">
          <span className="text-2xl font-light text-blue-500">$</span>
        </div>
        <span className="text-sm text-muted-foreground">fUSDC</span>
      </div>
    </div>
  );
}

export default function LandingV3() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Section - Ultra Minimal */}
      <section className="relative min-h-screen flex items-center">
        <GridBackground />
        <MinimalOrb />

        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Subtle badge */}
            <div className="flex items-center gap-2 mb-12 animate-[fadeInDown_0.6s_ease-out]">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground tracking-widest uppercase">Flow Blockchain</span>
            </div>

            {/* Main headline - very large and minimal */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-extralight tracking-tight mb-8 leading-[0.9]">
              <AnimatedText delay={200}>Naira</AnimatedText>
              <span className="text-muted-foreground/30 mx-4 animate-[fadeIn_1s_ease-out]">
                <ArrowRight className="inline h-12 w-12 md:h-16 md:w-16" />
              </span>
              <AnimatedText delay={400}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Stablecoins
                </span>
              </AnimatedText>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mb-12 animate-[fadeInUp_0.8s_ease-out]">
              The elegant way to convert between Nigerian Naira and Flow blockchain stablecoins.
              Minimal friction. Maximum security.
            </p>

            {/* Minimal CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-[fadeInUp_1s_ease-out]">
              <Button asChild size="lg" className="h-14 px-10 text-base font-normal bg-white text-black hover:bg-white/90 rounded-full">
                <Link href="/buy">
                  Begin
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-14 px-10 text-base font-normal rounded-full hover:bg-white/5">
                <Link href="#process">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-muted-foreground/30 to-transparent" />
        </div>
      </section>

      {/* Transaction Animation Section */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground mb-8 tracking-widest uppercase text-sm">Live Transaction Flow</p>
            <TransactionFlow />
            <p className="text-muted-foreground font-light mt-8">
              Every transaction is recorded on Flow blockchain in real-time
            </p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24" id="process">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16">
              <p className="text-muted-foreground mb-4 tracking-widest uppercase text-sm">Process</p>
              <h2 className="text-4xl md:text-5xl font-extralight">Two directions. One platform.</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <ProcessStep
                from="NGN"
                to="fUSDC"
                description="Convert Nigerian Naira to Flow stablecoins instantly. Deposit via bank transfer, receive tokens in seconds."
                direction="up"
              />
              <ProcessStep
                from="fUSDC"
                to="NGN"
                description="Sell your Flow stablecoins back to Naira. Funds arrive in your bank account within minutes."
                direction="down"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features - Minimal List */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16">
              <p className="text-muted-foreground mb-4 tracking-widest uppercase text-sm">Features</p>
              <h2 className="text-4xl md:text-5xl font-extralight">Built for precision.</h2>
            </div>

            <div>
              <FeatureItem
                title="Sub-30 Second Transactions"
                description="Flow blockchain's high throughput ensures your conversions complete almost instantly."
                delay={0}
              />
              <FeatureItem
                title="1.5% Transparent Fee"
                description="One simple fee. No hidden costs, no surprises. What you see is what you pay."
                delay={0.1}
              />
              <FeatureItem
                title="On-Chain Verification"
                description="Every transaction is recorded on Flow blockchain. Fully auditable, completely transparent."
                delay={0.2}
              />
              <FeatureItem
                title="Enterprise Security"
                description="Multi-signature wallets and cold storage protect your assets at all times."
                delay={0.3}
              />
              <FeatureItem
                title="Flow Native"
                description="Purpose-built for Flow blockchain. Support for fUSDC and fUSDT stablecoins."
                delay={0.4}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tech Credibility */}
      <section className="py-24 border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-12 text-muted-foreground/50">
              <div className="flex items-center gap-3 hover:text-muted-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">F</span>
                </div>
                <span className="font-light">Flow Blockchain</span>
              </div>
              <div className="flex items-center gap-3 hover:text-muted-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-500 font-bold">P</span>
                </div>
                <span className="font-light">Paystack</span>
              </div>
              <div className="flex items-center gap-3 hover:text-muted-foreground transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <span className="text-purple-500 font-bold">C</span>
                </div>
                <span className="font-light">Cadence Smart Contracts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Ultra Minimal */}
      <section className="py-32 border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-extralight mb-8 tracking-tight">
              Ready to begin?
            </h2>
            <p className="text-xl text-muted-foreground font-light mb-12">
              Start converting in under 2 minutes.
            </p>
            <Button asChild size="lg" className="h-16 px-12 text-lg font-normal bg-white text-black hover:bg-white/90 rounded-full">
              <Link href="/signup">
                Create Account
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Globe, ArrowUpRight, ArrowDownRight, CheckCircle2, Lock, Eye, Clock } from "lucide-react";
import { useEffect, useState } from "react";

// Animated counter component
function AnimatedCounter({ end, duration = 2000, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("stats-section");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Animated gradient orb
function GradientOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-primary/10 to-blue-600/10 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
    </div>
  );
}

// Floating particles
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/40 rounded-full animate-[float_10s_ease-in-out_infinite]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingV1() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background min-h-[90vh] flex items-center">
        <GradientOrb />
        <FloatingParticles />
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4 animate-[fadeInDown_0.6s_ease-out]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Now supporting Flow blockchain
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance animate-[fadeInUp_0.8s_ease-out]">
              Seamless Crypto{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400 animate-[gradientShift_3s_ease-in-out_infinite]">
                On/Off-Ramp
              </span>
              <br />for Flow Stablecoins
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto animate-[fadeInUp_1s_ease-out]">
              Convert between fiat and Flow blockchain stablecoins with institutional-grade security, lightning-fast transactions, and the lowest fees.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-[fadeInUp_1.2s_ease-out]">
              <Button asChild size="lg" className="text-lg h-14 px-8 group relative overflow-hidden">
                <Link href="/buy">
                  <span className="relative z-10 flex items-center">
                    Start Trading
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg h-14 px-8 bg-transparent backdrop-blur-sm border-primary/30 hover:border-primary/60">
                <Link href="#how-it-works">Watch Demo</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 animate-[fadeInUp_1.4s_ease-out]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Powered by Flow Blockchain
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                Bank-Grade Security
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4 text-primary" />
                End-to-End Encryption
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-16 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter end={2} prefix="$" suffix=".4B+" />
              </div>
              <p className="text-sm text-muted-foreground">Volume Processed</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter end={150} suffix="K+" />
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCounter end={99} suffix=".9%" />
              </div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                &lt; <AnimatedCounter end={30} suffix="s" />
              </div>
              <p className="text-sm text-muted-foreground">Avg Transaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for the Future of Finance</h2>
            <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
              Experience next-generation crypto infrastructure with Flow blockchain&apos;s speed and security
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Process transactions in under 30 seconds with Flow's high-performance blockchain infrastructure.",
              },
              {
                icon: Shield,
                title: "Bank-Grade Security",
                description: "Multi-signature wallets, cold storage, and institutional-grade security protocols protect your assets.",
              },
              {
                icon: Globe,
                title: "Lowest Fees",
                description: "Competitive rates starting at 0.5% with volume discounts for institutional clients.",
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="rounded-xl bg-primary/10 w-14 h-14 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="#" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* On-Ramp */}
            <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-green-500/10 p-3 animate-pulse">
                    <ArrowUpRight className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl">Buy Flow Stablecoins</CardTitle>
                </div>
                <CardDescription className="text-base">Convert NGN to Flow stablecoins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Animated progress line */}
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-green-500/50 to-green-500/20" />
                  {[
                    { step: 1, title: "Deposit NGN", desc: "Transfer Naira from your bank account or use our instant payment options" },
                    { step: 2, title: "Choose Stablecoin", desc: "Select between fUSDC or fUSDT and confirm exchange rate" },
                    { step: 3, title: "Receive Tokens", desc: "Get your stablecoins instantly in your Flow wallet" },
                  ].map((item, index) => (
                    <div key={item.step} className="flex gap-4 relative" style={{ animationDelay: `${index * 0.2}s` }}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-bold text-white z-10">
                        {item.step}
                      </div>
                      <div className="pb-6">
                        <p className="font-semibold text-lg">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Off-Ramp */}
            <Card className="border-2 border-amber-500/20 hover:border-amber-500/40 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-full bg-amber-500/10 p-3 animate-pulse">
                    <ArrowDownRight className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-2xl">Sell to NGN</CardTitle>
                </div>
                <CardDescription className="text-base">Convert Flow stablecoins to NGN</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-amber-500 via-amber-500/50 to-amber-500/20" />
                  {[
                    { step: 1, title: "Connect Wallet", desc: "Link your Flow wallet and select stablecoins to sell" },
                    { step: 2, title: "Set Amount", desc: "Enter the amount to sell and review the NGN conversion rate" },
                    { step: 3, title: "Receive NGN", desc: "Get Naira directly in your bank account within minutes" },
                  ].map((item, index) => (
                    <div key={item.step} className="flex gap-4 relative" style={{ animationDelay: `${index * 0.2}s` }}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold text-white z-10">
                        {item.step}
                      </div>
                      <div className="pb-6">
                        <p className="font-semibold text-lg">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Institutional-Grade Security</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your funds and data are protected by the same security standards used by major financial institutions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            {[
              { icon: Shield, title: "SOC 2 Certified", desc: "Audited security controls" },
              { icon: Lock, title: "Multi-Sig Wallets", desc: "Enhanced fund protection" },
              { icon: Eye, title: "Zero Knowledge", desc: "Privacy by design" },
              { icon: Clock, title: "Real-time Monitoring", desc: "24/7 fraud detection" },
            ].map((item, index) => (
              <div key={item.title} className="text-center group" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="rounded-2xl bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 transform duration-300">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Blockchain verification banner */}
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-card to-card/80 border-primary/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Blockchain Verification</h3>
                  <p className="text-sm text-muted-foreground">All transactions are recorded on Flow blockchain for complete transparency</p>
                </div>
              </div>
              <Button variant="outline" className="whitespace-nowrap">
                View on Explorer
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-blue-600/90" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white text-balance">
            Start Your Flow Journey Today
          </h2>
          <p className="text-lg mb-8 text-white/90 text-balance max-w-2xl mx-auto">
            Join thousands of users who trust FlowRamp for secure, fast, and reliable stablecoin conversions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg h-14 px-8 group">
              <Link href="/signup">
                Create Account
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg h-14 px-8 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white">
              <Link href="/support">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Percent, ChevronRight, Star, Users, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Animated background with moving gradients
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-transparent rounded-full blur-3xl animate-[spin_20s_linear_infinite]" />
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/30 via-blue-500/20 to-transparent rounded-full blur-3xl animate-[spin_25s_linear_infinite_reverse]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
    </div>
  );
}

// Currency converter preview widget
function ConverterWidget() {
  const [ngnAmount, setNgnAmount] = useState(100000);
  const exchangeRate = 1650;

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl shadow-primary/10 max-w-sm mx-auto animate-[fadeInUp_1s_ease-out]">
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <span>You send</span>
          <span className="text-green-500 text-xs">Best rate</span>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-green-500 font-bold">N</span>
          </div>
          <div className="flex-1">
            <input
              type="number"
              value={ngnAmount}
              onChange={(e) => setNgnAmount(Number(e.target.value))}
              className="bg-transparent text-2xl font-bold w-full outline-none"
            />
            <p className="text-xs text-muted-foreground">Nigerian Naira</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
            <ArrowRight className="h-5 w-5 text-primary rotate-90" />
          </div>
        </div>

        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold">$</span>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold">{(ngnAmount / exchangeRate).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">fUSDC</p>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          1 USD = {exchangeRate.toLocaleString()} NGN
        </div>

        <Button className="w-full h-12 text-base font-semibold group relative overflow-hidden">
          <span className="relative z-10">Convert Now</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
    </div>
  );
}

// Testimonial card with avatar
function TestimonialCard({ name, role, content, rating }: { name: string; role: string; content: string; rating: number }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="pt-6">
        <div className="flex gap-1 mb-4">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ))}
        </div>
        <p className="text-muted-foreground mb-4">&quot;{content}&quot;</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
            {name[0]}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Animated step card
function StepCard({ number, title, description, icon: Icon, delay }: { number: number; title: string; description: string; icon: React.ElementType; delay: number }) {
  return (
    <div
      className="relative group animate-[fadeInUp_0.6s_ease-out]"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Connecting line */}
      {number < 3 && (
        <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
      )}

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
            <Icon className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center font-bold text-primary">
            {number}
          </div>
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[200px]">{description}</p>
      </div>
    </div>
  );
}

// Social proof avatars
function SocialProof() {
  return (
    <div className="flex items-center gap-3 animate-[fadeInUp_1.6s_ease-out]">
      <div className="flex -space-x-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, hsl(${220 + i * 30}, 70%, 50%), hsl(${250 + i * 30}, 70%, 50%))`,
              color: "white",
            }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <div className="text-left">
        <p className="font-semibold">Join 10,000+ Nigerians</p>
        <p className="text-sm text-muted-foreground">trading on FlowRamp</p>
      </div>
    </div>
  );
}

export default function LandingV2() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Vibrant */}
      <section className="relative overflow-hidden min-h-[95vh] flex items-center bg-gradient-to-b from-background via-background to-muted/30">
        <AnimatedBackground />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 px-4 py-2 text-sm font-medium text-primary animate-[fadeInLeft_0.6s_ease-out]">
                <TrendingUp className="h-4 w-4" />
                Fastest growing ramp in Nigeria
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-[fadeInLeft_0.8s_ease-out]">
                Convert Naira to{" "}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-cyan-400">
                    Stablecoins
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,0 100,5 T200,5" fill="none" stroke="url(#gradient)" strokeWidth="3" className="animate-[draw_2s_ease-out]" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                {" "}in Minutes
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg animate-[fadeInLeft_1s_ease-out]">
                The easiest way to buy and sell Flow blockchain stablecoins. Low fees, instant transfers, trusted by thousands.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-[fadeInLeft_1.2s_ease-out]">
                <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 group">
                  <Link href="/signup">
                    Start Trading Free
                    <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg bg-transparent backdrop-blur border-2">
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>

              <SocialProof />
            </div>

            {/* Right - Converter Widget */}
            <div className="flex justify-center lg:justify-end">
              <ConverterWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="py-8 bg-gradient-to-r from-primary/5 via-purple-500/5 to-cyan-500/5 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Percent, text: "1.5% Fees Only" },
              { icon: Zap, text: "Instant Transfers" },
              { icon: Shield, text: "Bank-Grade Security" },
              { icon: Users, text: "24/7 Support" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual */}
      <section className="py-24" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold mb-2 block">Simple Process</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Three Steps to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                Freedom
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No complicated processes. Just connect, convert, and go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Create Account"
              description="Sign up with your email and complete our streamlined KYC process"
              icon={Users}
              delay={0}
            />
            <StepCard
              number={2}
              title="Connect Wallet"
              description="Link your Flow wallet or bank account to start trading instantly"
              icon={Wallet}
              delay={0.2}
            />
            <StepCard
              number={3}
              title="Start Trading"
              description="Buy or sell stablecoins with real-time rates and instant settlement"
              icon={TrendingUp}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Features Grid - Colorful */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold mb-2 block">Why FlowRamp</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built Different</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re not just another crypto platform. We&apos;re building the future of finance in Africa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Lowest Fees in Market",
                description: "Just 1.5% per transaction. No hidden charges, no surprises.",
                gradient: "from-green-500 to-emerald-500",
                icon: Percent,
              },
              {
                title: "Lightning Speed",
                description: "Most transactions complete in under 30 seconds.",
                gradient: "from-yellow-500 to-orange-500",
                icon: Zap,
              },
              {
                title: "Bank-Level Security",
                description: "Your funds are protected with enterprise-grade encryption.",
                gradient: "from-blue-500 to-cyan-500",
                icon: Shield,
              },
              {
                title: "Local Support",
                description: "Nigerian-based team available 24/7 via WhatsApp and email.",
                gradient: "from-purple-500 to-pink-500",
                icon: Users,
              },
              {
                title: "Real-Time Rates",
                description: "Get the best NGN rates updated every second.",
                gradient: "from-red-500 to-rose-500",
                icon: TrendingUp,
              },
              {
                title: "Flow Native",
                description: "Built specifically for Flow blockchain stablecoins.",
                gradient: "from-indigo-500 to-violet-500",
                icon: Wallet,
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className="group overflow-hidden border-border/50 hover:border-transparent transition-all duration-300 hover:shadow-xl"
              >
                <div className={`h-1 w-full bg-gradient-to-r ${feature.gradient}`} />
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold mb-2 block">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Thousands</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the community of traders who&apos;ve made FlowRamp their go-to platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <TestimonialCard
              name="Adebayo O."
              role="Crypto Trader, Lagos"
              content="FlowRamp is the fastest ramp I've used. My transactions go through in seconds, not hours like other platforms."
              rating={5}
            />
            <TestimonialCard
              name="Chioma N."
              role="Business Owner, Abuja"
              content="Finally, a platform that understands Nigerian users. The NGN rates are always competitive and withdrawals are instant."
              rating={5}
            />
            <TestimonialCard
              name="Emmanuel K."
              role="Developer, Port Harcourt"
              content="As a Flow developer, having a reliable NGN ramp is essential. FlowRamp delivers every time with great support."
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Vibrant */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-cyan-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white text-balance">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90 text-balance max-w-2xl mx-auto">
            Join thousands of users already trading on FlowRamp&apos;s secure platform
          </p>
          <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold bg-white text-primary hover:bg-white/90">
            <Link href="/signup">
              Create Account Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-6 text-white/70 text-sm">
            No credit card required. Start trading in 2 minutes.
          </p>
        </div>
      </section>
    </div>
  );
}

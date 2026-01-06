import type { Metadata } from "next";
import { AuthProvider } from "@/lib/firebase/auth";
import { TourProvider } from "@/lib/contexts/tour-context";
import { LandingVersionProvider } from "@/lib/contexts/landing-version-context";
import { TourDriver } from "@/components/guided-tour/tour-driver";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import NavLinks from "@/components/nav-links";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "FlowRamp - Flow Blockchain On/Off Ramp",
  description: "Buy and sell Flow stablecoins with Nigerian Naira",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <LandingVersionProvider>
          <TourProvider>
            <TourDriver />
            <a href="#main-content" className="skip-to-main">
              Skip to main content
            </a>
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">F</span>
                  </div>
                  <span className="font-bold text-xl">FlowRamp</span>
                </Link>
                <NavLinks />
              </div>
            </div>
        </nav>

        <main id="main-content">
          {children}
        </main>

          <footer className="border-t bg-muted/30 mt-24">
            <div className="container mx-auto px-4 py-12">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">F</span>
                    </div>
                    <span className="font-bold text-xl">FlowRamp</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your gateway to Flow stablecoins. Fast, secure, and transparent.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Product</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link href="/buy" className="hover:text-foreground transition-colors">
                        Buy Stablecoins
                      </Link>
                    </li>
                    <li>
                      <Link href="/sell" className="hover:text-foreground transition-colors">
                        Sell Stablecoins
                      </Link>
                    </li>
                    <li>
                      <Link href="/wallet" className="hover:text-foreground transition-colors">
                        Wallet
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Technology</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Flow Blockchain</li>
                    <li>Forte Actions</li>
                    <li>Scheduled Transactions</li>
                    <li>FCL Wallet Integration</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Support</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link href="/support" className="hover:text-foreground transition-colors">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin" className="hover:text-foreground transition-colors">
                        Admin Dashboard
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                <p>&copy; 2025 FlowRamp. Built on Flow Blockchain with Forte Actions.</p>
              </div>
            </div>
        </footer>
        <Toaster />
            <SonnerToaster position="top-right" richColors />
          </TourProvider>
          </LandingVersionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

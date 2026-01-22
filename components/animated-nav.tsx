"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, logout } from "@/lib/firebase/auth";
import { useTour } from "@/lib/contexts/tour-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LayoutDashboard, History, LogOut, HelpCircle, Menu, X, ShoppingCart, Wallet, TrendingUp } from "lucide-react";
import LandingVersionSwitcher from "@/components/landing-version-switcher";

export default function AnimatedNav() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { startTour } = useTour();
  const isHomePage = pathname === "/";
  const [isOpen, setIsOpen] = useState(false);

  const handleStartTour = () => {
    router.push("/");
    setTimeout(() => {
      startTour();
    }, 300);
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    { href: "/buy", label: "Buy", icon: ShoppingCart },
    { href: "/sell", label: "Sell", icon: TrendingUp },
    { href: "/wallet", label: "Wallet", icon: Wallet },
  ];

  return (
    <>
      {/* Navigation Toggle - Always Visible */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background/80 backdrop-blur-sm border-border"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Animated Side Navigation - Always Hidden by Default */}
      <div
        className={`fixed top-0 left-0 h-full bg-background/95 backdrop-blur-md border-r border-border z-40 transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 lg:w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">F</span>
              </div>
              <span className="font-bold text-2xl">FlowRamp</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {isHomePage && (
              <div className="mb-4">
                <LandingVersionSwitcher />
              </div>
            )}
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted hover:text-foreground text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* User Section */}
            {user && (
              <div className="pt-4 border-t border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-4 py-3 h-auto hover:bg-muted"
                    >
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 ml-4" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild onClick={() => setIsOpen(false)}>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild onClick={() => setIsOpen(false)}>
                      <Link href="/dashboard?tab=transactions" className="cursor-pointer">
                        <History className="mr-2 h-4 w-4" />
                        <span>Transaction History</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild onClick={() => setIsOpen(false)}>
                      <Link href="/dashboard?tab=profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleStartTour} className="cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Take a Tour</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Auth Section for non-logged users */}
            {!user && (
              <div className="pt-4 border-t border-border space-y-2">
                <Link
                  href="/signin"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-center rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Sign In
                </Link>
                <Button asChild onClick={() => setIsOpen(false)} className="w-full">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Overlay - Always Visible When Sidebar is Open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

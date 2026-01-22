"use client";

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
import { User, LayoutDashboard, History, LogOut, HelpCircle } from "lucide-react";
import MobileNav from "@/components/mobile-nav";
import LandingVersionSwitcher from "@/components/landing-version-switcher";

export default function NavLinks() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { startTour } = useTour();
  const isHomePage = pathname === "/";

  const handleStartTour = () => {
    router.push("/");
    // Small delay to ensure we're on home page before starting tour
    setTimeout(() => {
      startTour();
    }, 300);
  };

  // Get user initials for avatar
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

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        {isHomePage && <LandingVersionSwitcher />}
        <Link href="/buy" className="text-sm font-medium hover:text-primary transition-colors">
          Buy
        </Link>
        <Link href="/sell" className="text-sm font-medium hover:text-primary transition-colors">
          Sell
        </Link>
        <Link href="/wallet" className="text-sm font-medium hover:text-primary transition-colors">
          Wallet
        </Link>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
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
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard?tab=transactions" className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  <span>Transaction History</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
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
        ) : (
          <>
            <Link href="/signin" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-medium hover:text-primary transition-colors">
              Sign Up
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </>
        )}
      </div>
    </>
  );
}

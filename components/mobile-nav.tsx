"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, logout } from "@/lib/firebase/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Menu,
  User,
  LayoutDashboard,
  History,
  LogOut,
  ShoppingCart,
  Banknote,
  Wallet,
  Shield
} from "lucide-react";

export default function MobileNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
    setOpen(false);
    router.push("/");
  };

  const handleNavigation = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span>FlowRamp</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 py-4">
          {/* Main Navigation */}
          <button
            onClick={() => handleNavigation("/buy")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Buy</span>
          </button>

          <button
            onClick={() => handleNavigation("/sell")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Banknote className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Sell</span>
          </button>

          <button
            onClick={() => handleNavigation("/wallet")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Wallet</span>
          </button>

          <button
            onClick={() => handleNavigation("/admin")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Admin</span>
          </button>
        </nav>

        {user ? (
          <>
            <div className="border-t py-4">
              <div className="flex items-center gap-3 px-4 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavigation("/dashboard?tab=transactions")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <History className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Transaction History</span>
                </button>

                <button
                  onClick={() => handleNavigation("/dashboard?tab=profile")}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Profile Settings</span>
                </button>
              </nav>
            </div>

            <div className="border-t py-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left w-full text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </>
        ) : (
          <div className="border-t py-4 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleNavigation("/signin")}
            >
              Sign In
            </Button>
            <Button
              className="w-full"
              onClick={() => handleNavigation("/signup")}
            >
              Get Started
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

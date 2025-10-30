"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, logout } from "@/lib/firebase/auth";

export default function NavLinks() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-6">
      <Link href="/buy" className="text-sm font-medium hover:text-primary transition-colors">
        Buy
      </Link>
      <Link href="/sell" className="text-sm font-medium hover:text-primary transition-colors">
        Sell
      </Link>
      <Link href="/wallet" className="text-sm font-medium hover:text-primary transition-colors">
        Wallet
      </Link>
      <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
        Admin
      </Link>
      {user ? (
        <Button onClick={logout} size="sm" variant="outline">
          Sign Out
        </Button>
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
  );
}

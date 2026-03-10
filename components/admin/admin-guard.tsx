"use client";

import { useAuth } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        router.push("/signin");
        return;
      }

      if (!backendUrl) {
        console.error("NEXT_PUBLIC_BACKEND_URL is missing");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/admin/check-role`, {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(Boolean(data.isAdmin));
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [backendUrl, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Admin access requires:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Valid user account</li>
                <li>Admin role in Firebase</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
                Go Home
              </Button>
              <Button onClick={() => router.push("/signin")} className="flex-1">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle, resetPassword } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signInWithEmail(email, password);
    
    if (result.user) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to sign in");
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    const result = await signInWithGoogle();

    if (result.user) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to sign in with Google");
    }

    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await resetPassword(email);

    if (result.success) {
      setSuccess("Password reset email sent! Check your inbox.");
      setForgotPassword(false);
    } else {
      setError(result.error || "Failed to send reset email");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/" />
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {forgotPassword ? "Reset Password" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {forgotPassword
                ? "Enter your email to receive a password reset link"
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {!forgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassword(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}
              {forgotPassword ? (
                <>
                  <Button onClick={handleResetPassword} className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button
                    onClick={() => {
                      setForgotPassword(false);
                      setError("");
                      setSuccess("");
                    }}
                    className="w-full"
                    variant="outline"
                    disabled={loading}
                  >
                    Back to Sign In
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleSignIn} className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <Button onClick={handleGoogleSignIn} className="w-full" variant="outline" disabled={loading}>
                    Sign In with Google
                  </Button>
                </>
              )}
              <p className="text-sm text-center text-gray-600">
                Don't have an account?{" "}
                <a href="/signup" className="text-blue-600 hover:underline">
                  Sign Up
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

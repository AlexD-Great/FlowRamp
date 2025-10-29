// API calls for dashboard data
import { User } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function getAuthToken(user: User | null): Promise<string> {
  if (!user) throw new Error("User not authenticated");
  return await user.getIdToken();
}

export async function fetchOnRampSessions(user: User | null) {
  const token = await getAuthToken(user);
  const response = await fetch(`${API_URL}/api/onramp/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch on-ramp sessions");
  }

  return await response.json();
}

export async function fetchOffRampRequests(user: User | null) {
  const token = await getAuthToken(user);
  const response = await fetch(`${API_URL}/api/offramp/requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch off-ramp requests");
  }

  return await response.json();
}

export async function fetchWalletBalance(walletAddress: string, user: User | null) {
  if (!walletAddress || !walletAddress.startsWith("0x")) {
    return {
      flow: "0.00",
      fusdc: "0.00",
      fusdt: "0.00",
    };
  }

  try {
    const token = await getAuthToken(user);
    const response = await fetch(`${API_URL}/api/wallet/balance/${walletAddress}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wallet balance");
    }

    const data = await response.json();
    return {
      flow: data.flow || "0.00",
      fusdc: data.fusdc || "0.00",
      fusdt: data.fusdt || "0.00",
    };
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return {
      flow: "0.00",
      fusdc: "0.00",
      fusdt: "0.00",
    };
  }
}

export async function updateUserProfile(user: User | null, data: { displayName?: string }) {
  const token = await getAuthToken(user);
  
  // Update Firebase Auth profile
  const { updateProfile } = await import("firebase/auth");
  
  if (user && data.displayName) {
    await updateProfile(user, {
      displayName: data.displayName,
    });
  }
  
  return { success: true };
}

export async function fetchKYCStatus(user: User | null) {
  try {
    const token = await getAuthToken(user);
    const response = await fetch(`${API_URL}/api/kyc/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch KYC status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    return {
      status: "not_started",
      emailVerified: user?.emailVerified || false,
      submittedAt: null,
      reviewedAt: null,
    };
  }
}

export async function submitKYCApplication(user: User | null, data: any) {
  const token = await getAuthToken(user);
  const response = await fetch(`${API_URL}/api/kyc/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit KYC");
  }

  return await response.json();
}

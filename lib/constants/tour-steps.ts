import { DriveStep } from "driver.js";

export interface TourStep extends DriveStep {
  page: string;
}

export const tourSteps: TourStep[] = [
  // Home Page Steps
  {
    page: "/",
    popover: {
      title: "Welcome to FlowRamp!",
      description: "Let's take a quick tour to help you get started with buying and selling Flow stablecoins.",
      side: "over",
      align: "center",
    },
  },
  {
    page: "/",
    element: "#hero-cta-buy",
    popover: {
      title: "Buy Stablecoins",
      description: "Click here to convert your Nigerian Naira (NGN) to Flow stablecoins like fUSDC or fUSDT.",
      side: "bottom",
      align: "center",
    },
  },
  {
    page: "/",
    element: "#hero-cta-sell",
    popover: {
      title: "Sell Stablecoins",
      description: "Or sell your Flow stablecoins and receive NGN directly to your bank account.",
      side: "bottom",
      align: "center",
    },
  },
  {
    page: "/",
    element: "#how-it-works",
    popover: {
      title: "How It Works",
      description: "Here you can see the simple 3-step process for both buying and selling stablecoins.",
      side: "top",
      align: "center",
    },
  },

  // Wallet Page Steps
  {
    page: "/wallet",
    element: "#wallet-connect-card",
    popover: {
      title: "Connect Your Wallet",
      description: "First, connect your Flow wallet (like Blocto or Lilico) to start trading. This verifies your identity on the blockchain.",
      side: "bottom",
      align: "center",
    },
  },
  {
    page: "/wallet",
    element: "#wallet-balance-card",
    popover: {
      title: "View Your Balances",
      description: "Once connected, you can see your FLOW, fUSDC, and fUSDT balances here.",
      side: "top",
      align: "center",
    },
  },

  // Buy Page Steps
  {
    page: "/buy",
    element: "#buy-form-card",
    popover: {
      title: "Buy Form",
      description: "This is where you'll enter the details for purchasing stablecoins.",
      side: "right",
      align: "start",
    },
  },
  {
    page: "/buy",
    element: "#buy-wallet-input",
    popover: {
      title: "Wallet Address",
      description: "Enter your Flow wallet address where you want to receive the stablecoins.",
      side: "bottom",
      align: "center",
    },
  },
  {
    page: "/buy",
    element: "#buy-amount-input",
    popover: {
      title: "Enter Amount",
      description: "Enter the amount in NGN you want to spend. Min ₦5,000, Max ₦1,000,000.",
      side: "bottom",
      align: "center",
    },
  },

  // Sell Page Steps
  {
    page: "/sell",
    element: "#sell-form-card",
    popover: {
      title: "Sell Form",
      description: "Here you can sell your stablecoins and receive NGN.",
      side: "right",
      align: "start",
    },
  },
  {
    page: "/sell",
    element: "#sell-payout-method",
    popover: {
      title: "Choose Payout Method",
      description: "Select how you want to receive your money: Bank Transfer or Mobile Money.",
      side: "top",
      align: "center",
    },
  },

  // Dashboard Steps
  {
    page: "/dashboard",
    element: "#dashboard-stats",
    popover: {
      title: "Your Dashboard",
      description: "Track all your transactions, view stats, and manage your account from here.",
      side: "bottom",
      align: "center",
    },
  },
  {
    page: "/dashboard",
    element: "#dashboard-quick-actions",
    popover: {
      title: "Quick Actions",
      description: "Quickly access Buy, Sell, Swap, and Wallet features from here.",
      side: "top",
      align: "center",
    },
  },

  // Tour Complete
  {
    page: "/dashboard",
    popover: {
      title: "You're All Set!",
      description: "You now know the basics of FlowRamp. Start by connecting your wallet and making your first transaction!",
      side: "over",
      align: "center",
    },
  },
];

// Helper to get steps for a specific page
export function getStepsForPage(page: string): TourStep[] {
  return tourSteps.filter((step) => step.page === page);
}

// Helper to get step index for navigation
export function getFirstStepIndexForPage(page: string): number {
  return tourSteps.findIndex((step) => step.page === page);
}

// Get the page for a step index
export function getPageForStep(stepIndex: number): string {
  return tourSteps[stepIndex]?.page || "/";
}

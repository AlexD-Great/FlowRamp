"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type LandingVersion = "v1" | "v2" | "v3";

interface LandingVersionContextType {
  version: LandingVersion;
  setVersion: (version: LandingVersion) => void;
  versionLabels: Record<LandingVersion, string>;
}

const versionLabels: Record<LandingVersion, string> = {
  v1: "Trust & Security",
  v2: "Conversion Focus",
  v3: "Premium Minimal",
};

const LandingVersionContext = createContext<LandingVersionContextType | undefined>(undefined);

export function LandingVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<LandingVersion>("v1");

  return (
    <LandingVersionContext.Provider value={{ version, setVersion, versionLabels }}>
      {children}
    </LandingVersionContext.Provider>
  );
}

export function useLandingVersion() {
  const context = useContext(LandingVersionContext);
  if (context === undefined) {
    throw new Error("useLandingVersion must be used within a LandingVersionProvider");
  }
  return context;
}

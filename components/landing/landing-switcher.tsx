"use client";

import { useLandingVersion } from "@/lib/contexts/landing-version-context";
import { LandingV1, LandingV2, LandingV3 } from "@/components/landing";

export default function LandingSwitcher() {
  const { version } = useLandingVersion();

  switch (version) {
    case "v1":
      return <LandingV1 />;
    case "v2":
      return <LandingV2 />;
    case "v3":
      return <LandingV3 />;
    default:
      return <LandingV1 />;
  }
}

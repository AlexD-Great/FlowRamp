"use client";

import { useLandingVersion, LandingVersion } from "@/lib/contexts/landing-version-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette, Check, Shield, Zap, Sparkles } from "lucide-react";

const versionIcons: Record<LandingVersion, React.ElementType> = {
  v1: Shield,
  v2: Zap,
  v3: Sparkles,
};

const versionDescriptions: Record<LandingVersion, string> = {
  v1: "Trust & security focused design",
  v2: "Conversion-focused, vibrant style",
  v3: "Premium minimalist aesthetic",
};

export default function LandingVersionSwitcher() {
  const { version, setVersion, versionLabels } = useLandingVersion();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50">
          <Palette className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">{versionLabels[version]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Landing Page Style
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(versionLabels) as LandingVersion[]).map((v) => {
          const Icon = versionIcons[v];
          const isActive = version === v;
          return (
            <DropdownMenuItem
              key={v}
              onClick={() => setVersion(v)}
              className={`flex items-start gap-3 py-3 cursor-pointer ${isActive ? "bg-primary/10" : ""}`}
            >
              <div className={`p-2 rounded-lg ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{versionLabels[v]}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{versionDescriptions[v]}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

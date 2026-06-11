"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export function useDisplayName() {
  const { userId } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { 
      setLoading(false); 
      return; 
    }

    setLoading(true);
    fetch("/api/user-profile")
      .then((r) => r.json())
      .then((data) => {
        console.log("Fetched display name:", data);
        if (data.displayName) {
          setDisplayName(data.displayName);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch display name:", err);
        setNeedsOnboarding(true);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  function completeOnboarding(name: string) {
    setDisplayName(name);
    setNeedsOnboarding(false);
  }

  return { displayName, needsOnboarding, loading, completeOnboarding };
}

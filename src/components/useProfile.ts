"use client";

import { useCallback, useEffect, useState } from "react";
import { loadProfile, saveProfile } from "@/lib/store";
import type { StoredProfile } from "@/lib/types";

export function useProfile() {
  const [profile, setProfileState] = useState<StoredProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setProfileState(loadProfile());
    sync();
    setLoaded(true);
    window.addEventListener("pq:profile", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pq:profile", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setProfile = useCallback((p: StoredProfile) => {
    saveProfile(p);
    setProfileState(p);
  }, []);

  return { profile, setProfile, loaded };
}

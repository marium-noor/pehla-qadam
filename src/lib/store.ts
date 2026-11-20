import type { ChatUsage } from "./limits";
import type { Route, StoredProfile } from "./types";

const KEY = "pq.profile";

export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: StoredProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("pq:profile")); // lets the header and pages update without a reload
  } catch {
    /* private mode or full storage: the app keeps working for this visit */
  }
}

export function updateProfile(patch: Partial<StoredProfile>): StoredProfile | null {
  const cur = loadProfile();
  if (!cur) return null;
  const next = { ...cur, ...patch };
  saveProfile(next);
  return next;
}

export function setRoute(route: Route): StoredProfile | null {
  return updateProfile({ route });
}

export function toggleDone(week: number, done: boolean): StoredProfile | null {
  const cur = loadProfile();
  if (!cur) return null;
  const set = new Set(cur.done);
  if (done) set.add(week);
  else set.delete(week);
  return updateProfile({ done: [...set].sort((a, b) => a - b) });
}

/** Lesson N unlocks (N-1) weeks after sign-up. Week 1 is open immediately. */
export function unlockDate(createdAt: number, week: number): Date {
  return new Date(createdAt + (week - 1) * 7 * 24 * 60 * 60 * 1000);
}

export function isUnlocked(p: StoredProfile, week: number, now = Date.now()): boolean {
  return Boolean(p.unlockAll) || unlockDate(p.createdAt, week).getTime() <= now;
}

// Demo mode only: the daily free-chat count lives in this browser, so it is NOT enforced on the server.
// People with a saved profile are counted in the database instead.
const CHAT_KEY = "pq.chat";

export function loadChatUsage(): ChatUsage {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const j = raw ? (JSON.parse(raw) as Partial<ChatUsage>) : null;
    if (j && typeof j.count === "number" && (typeof j.day === "string" || j.day === null)) return { day: j.day ?? null, count: j.count };
  } catch {
    /* ignore */
  }
  return { day: null, count: 0 };
}

export function saveChatUsage(u: ChatUsage): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(u));
  } catch {
    /* private mode: the limit just resets on reload */
  }
}

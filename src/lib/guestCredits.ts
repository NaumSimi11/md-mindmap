// Guest AI credits manager - localStorage with daily reset

interface GuestCreditsState {
  date: string; // yyyy-mm-dd
  remaining: number;
}

const STORAGE_PREFIX = 'guest.ai.credits.';
const DEFAULT_DAILY_RUNS = Number(import.meta.env.VITE_GUEST_DAILY_RUNS ?? 3);

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayKey(): string {
  return `${STORAGE_PREFIX}${formatDate(new Date())}`;
}

function readState(): GuestCreditsState {
  const key = getTodayKey();
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as GuestCreditsState;
      // Basic validation
      if (parsed && typeof parsed.remaining === 'number' && typeof parsed.date === 'string') {
        return parsed;
      }
    } catch {
      // fallthrough to reset
    }
  }
  const fresh: GuestCreditsState = { date: formatDate(new Date()), remaining: DEFAULT_DAILY_RUNS };
  localStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
}

function writeState(state: GuestCreditsState): void {
  localStorage.setItem(getTodayKey(), JSON.stringify(state));
}

export function getGuestCredits(): { remaining: number; total: number; date: string } {
  const state = readState();
  return { remaining: Math.max(0, state.remaining), total: DEFAULT_DAILY_RUNS, date: state.date };
}

export function decrementGuestCredits(): number {
  const state = readState();
  const updated = { ...state, remaining: Math.max(0, state.remaining - 1) };
  writeState(updated);
  return updated.remaining;
}

export function resetGuestCredits(): void {
  const fresh: GuestCreditsState = { date: formatDate(new Date()), remaining: DEFAULT_DAILY_RUNS };
  writeState(fresh);
}



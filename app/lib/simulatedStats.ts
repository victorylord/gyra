// ============================================================
// Simulated stat base + increment engine
// Persists in-memory per server instance. Resets on cold start.
// ============================================================

export const BASE_TOTAL = 908_864;
export const BASE_TODAY = 23_030;
export const BASE_MONTH = 588_800;

export const BASE_ENDPOINTS: { endpoint: string; count: number }[] = [
  { endpoint: "/api/v1/chat", count: 1_906 },
  { endpoint: "/api/chat", count: 1_673 },
  { endpoint: "/api/v1/video/generate", count: 1_331 },
  { endpoint: "/api/v1/voice", count: 1_190 },
  { endpoint: "/api/v1/transcribe", count: 1_011 },
  { endpoint: "/api/v1/credits", count: 742 },
];

// Small random helper
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Increment window per speed tier
const MIN_TICK = 5;
const MAX_TICK = 20;

// Increment every N ms
export const TICK_INTERVAL_MS = 8_000;

type SimulatorState = {
  startedAt: number;
  total: number;
  today: number;
  month: number;
  endpoints: Map<string, number>;
  lastTickAt: number;
};

// Module-level state — persists across requests in the same server instance
let state: SimulatorState = makeInitialState();

function makeInitialState(): SimulatorState {
  const map = new Map<string, number>();
  for (const e of BASE_ENDPOINTS) map.set(e.endpoint, e.count);
  return {
    startedAt: Date.now(),
    total: BASE_TOTAL,
    today: BASE_TODAY,
    month: BASE_MONTH,
    endpoints: map,
    lastTickAt: Date.now(),
  };
}

// Add a real incoming request to the running counts
export function recordRealRequest(endpoint: string) {
  state.total += 1;
  state.today += 1;
  state.month += 1;
  state.endpoints.set(endpoint, (state.endpoints.get(endpoint) || 0) + 1);
}

// Catch up the simulator based on how much time has passed
// This runs on every read, so numbers always look live
function catchUp() {
  const now = Date.now();
  const elapsed = now - state.lastTickAt;
  const ticks = Math.floor(elapsed / TICK_INTERVAL_MS);

  if (ticks <= 0) return;

  for (let i = 0; i < ticks; i++) {
    const delta = rand(MIN_TICK, MAX_TICK);
    state.total += delta;
    state.today += delta;
    state.month += delta;

    // Distribute the delta across endpoints
    // Pick 1–3 random endpoints to give the increment to
    const keys = Array.from(state.endpoints.keys());
    const pickCount = Math.min(keys.length, rand(1, 3));
    const shuffled = [...keys].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, pickCount);

    // Split delta across chosen endpoints
    let remaining = delta;
    for (let j = 0; j < chosen.length; j++) {
      const share =
        j === chosen.length - 1
          ? remaining
          : Math.max(1, Math.floor(remaining / (chosen.length - j)));
      state.endpoints.set(
        chosen[j],
        (state.endpoints.get(chosen[j]) || 0) + share
      );
      remaining -= share;
      if (remaining <= 0) break;
    }
  }

  state.lastTickAt = now;
}

// ============================================================
// Public read API — always returns the current "live" stats
// ============================================================

export function getSimulatedSummary() {
  catchUp();
  return {
    total: state.total,
    today: state.today,
    month: state.month,
  };
}

export function getSimulatedEndpoints(limit = 10) {
  catchUp();
  const arr = Array.from(state.endpoints.entries()).map(
    ([endpoint, count]) => ({ endpoint, count })
  );
  arr.sort((a, b) => b.count - a.count);
  return arr.slice(0, limit);
}

// The process start time — useful for "since launch" display
export function getSimulatorStartTime(): string {
  return new Date(state.startedAt).toISOString();
}
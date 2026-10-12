// ============================================================
// Simulated stat base + increment engine
// All numbers derive from the day total, so endpoints always
// sum to the "today" figure.
// ============================================================

// Top-level targets
export const BASE_TOTAL = 908_864;
export const BASE_TODAY = 23_030;
export const BASE_MONTH = 588_800;

// Endpoint distribution — these are WEIGHTS, not values
// The day total gets split across them at read time
const ENDPOINT_WEIGHTS: { endpoint: string; weight: number }[] = [
  { endpoint: "/api/v1/chat", weight: 24.3 },
  { endpoint: "/api/chat", weight: 21.3 },
  { endpoint: "/api/v1/video/generate", weight: 17.0 },
  { endpoint: "/api/v1/voice", weight: 15.2 },
  { endpoint: "/api/v1/transcribe", weight: 12.9 },
  { endpoint: "/api/v1/credits", weight: 9.3 },
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MIN_TICK = 5;
const MAX_TICK = 20;
export const TICK_INTERVAL_MS = 8_000;

type SimulatorState = {
  startedAt: number;
  total: number;
  today: number;
  month: number;
  // Extra "noise" per endpoint on top of the weighted split
  endpointNoise: Map<string, number>;
  lastTickAt: number;
};

let state: SimulatorState = makeInitialState();

function makeInitialState(): SimulatorState {
  const noise = new Map<string, number>();
  for (const e of ENDPOINT_WEIGHTS) noise.set(e.endpoint, 0);
  return {
    startedAt: Date.now(),
    total: BASE_TOTAL,
    today: BASE_TODAY,
    month: BASE_MONTH,
    endpointNoise: noise,
    lastTickAt: Date.now(),
  };
}

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

    // Distribute delta across endpoints by weight
    // Each endpoint gets approximately (delta * weight/100)
    // But we add randomness so it isn't too clean
    let distributed = 0;
    for (let j = 0; j < ENDPOINT_WEIGHTS.length; j++) {
      const ep = ENDPOINT_WEIGHTS[j];
      const isLast = j === ENDPOINT_WEIGHTS.length - 1;
      const share = isLast
        ? delta - distributed
        : Math.max(
            0,
            Math.round(delta * (ep.weight / 100) + rand(-1, 1))
          );
      const capped = Math.max(0, Math.min(share, delta - distributed));
      state.endpointNoise.set(
        ep.endpoint,
        (state.endpointNoise.get(ep.endpoint) || 0) + capped
      );
      distributed += capped;
      if (distributed >= delta) break;
    }
  }

  state.lastTickAt = now;
}

export function getSimulatedSummary() {
  catchUp();
  return {
    total: state.total,
    today: state.today,
    month: state.month,
  };
}

// ============================================================
// Endpoints are computed FROM the today total
// so the sum of all endpoints always equals today (or very close)
// ============================================================

export function getSimulatedEndpoints(limit = 10) {
  catchUp();

  const todayTotal = state.today;
  const results: { endpoint: string; count: number }[] = [];

  let allocated = 0;
  for (let i = 0; i < ENDPOINT_WEIGHTS.length; i++) {
    const ep = ENDPOINT_WEIGHTS[i];
    const isLast = i === ENDPOINT_WEIGHTS.length - 1;

    // Calculate share based on weight, plus noise from ticks
    const baseShare = Math.floor(todayTotal * (ep.weight / 100));
    const noise = state.endpointNoise.get(ep.endpoint) || 0;

    // Scale noise proportionally so it doesn't distort the total
    const noiseScaled = Math.floor(noise * 0.15);

    const raw = baseShare + noiseScaled;

    // Force last endpoint to fill the gap so sum == today
    const value = isLast ? Math.max(0, todayTotal - allocated) : raw;

    results.push({ endpoint: ep.endpoint, count: value });
    allocated += value;
  }

  // If there's any leftover or overshoot, adjust the top endpoint
  // This guarantees the total always matches exactly
  const currentSum = results.reduce((a, b) => a + b.count, 0);
  const diff = todayTotal - currentSum;
  if (diff !== 0 && results.length > 0) {
    results[0].count += diff;
  }

  results.sort((a, b) => b.count - a.count);
  return results.slice(0, limit);
}

export function getSimulatorStartTime(): string {
  return new Date(state.startedAt).toISOString();
}

// Record a real request from a real endpoint
export function recordRealRequest(endpoint: string) {
  state.total += 1;
  state.today += 1;
  state.month += 1;
  // Also track on the endpoint if it's one of ours
  if (state.endpointNoise.has(endpoint)) {
    state.endpointNoise.set(
      endpoint,
      (state.endpointNoise.get(endpoint) || 0) + 1
    );
  }
}
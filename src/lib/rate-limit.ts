
type RateLimitStore = Map<string, { count: number; firstRequest: number }>;

const rateLimitStore: RateLimitStore = new Map();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function rateLimit(ip: string, config: RateLimitConfig = { windowMs: 60 * 60 * 1000, max: 25 }) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return { success: true, remaining: config.max - 1 };
  }

  if (now - record.firstRequest > config.windowMs) {
    // Reset window
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return { success: true, remaining: config.max - 1 };
  }

  if (record.count >= config.max) {
    return { success: false, remaining: 0, reset: record.firstRequest + config.windowMs };
  }

  record.count += 1;
  return { success: true, remaining: config.max - record.count };
}

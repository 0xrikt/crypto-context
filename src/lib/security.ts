/**
 * Security utilities: rate limiting, input validation, error sanitization.
 * All functions are pure or use only module-level state (rate limiter).
 */

// ---------- Rate Limiter (in-memory, per-instance) ----------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit. Returns { allowed, remaining, resetAt } or { allowed: false }.
 * Uses IP + route as key. Vercel provides real IP via x-forwarded-for.
 */
export function checkRateLimit(
  ip: string,
  route: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupStaleEntries();

  const key = `${ip}:${route}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment within window (immutable update)
  rateLimitStore.set(key, { ...entry, count: entry.count + 1 });
  return {
    allowed: true,
    remaining: maxRequests - entry.count - 1,
    resetAt: entry.resetAt,
  };
}

// Rate limit presets
export const RATE_LIMITS = {
  /** Exchange connect: 5 per minute (expensive operation) */
  exchangeConnect: { maxRequests: 5, windowMs: 60_000 },
  /** Portfolio fetch: 10 per minute */
  portfolioFetch: { maxRequests: 10, windowMs: 60_000 },
  /** MCP endpoint: 30 per minute */
  mcp: { maxRequests: 30, windowMs: 60_000 },
  /** Token generation: 5 per minute */
  tokenGenerate: { maxRequests: 5, windowMs: 60_000 },
  /** General API: 20 per minute */
  general: { maxRequests: 20, windowMs: 60_000 },
} as const;

// ---------- Input Validation ----------

/** Max lengths for user inputs */
const MAX_LENGTHS = {
  apiKey: 256,
  secret: 512,
  password: 128,
  exchange: 20,
  label: 100,
  connectionId: 64,
  tokenName: 50,
} as const;

/** Validate exchange API key format */
export function validateApiKey(value: string): string | null {
  if (!value || typeof value !== "string") return "API key is required";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "API key is required";
  if (trimmed.length > MAX_LENGTHS.apiKey) return "API key is too long";
  // Basic format: alphanumeric + common separators
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) return "API key contains invalid characters";
  return null;
}

/** Validate exchange API secret format */
export function validateSecret(value: string): string | null {
  if (!value || typeof value !== "string") return "API secret is required";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "API secret is required";
  if (trimmed.length > MAX_LENGTHS.secret) return "API secret is too long";
  return null;
}

/** Validate passphrase */
export function validatePassphrase(value: string): string | null {
  if (!value || typeof value !== "string") return "Passphrase is required";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Passphrase is required";
  if (trimmed.length > MAX_LENGTHS.password) return "Passphrase is too long";
  return null;
}

/** Validate label */
export function validateLabel(value: string): string | null {
  if (!value || typeof value !== "string") return null; // Optional
  if (value.length > MAX_LENGTHS.label) return "Label is too long";
  return null;
}

/** Validate UUID format (for connection IDs) */
export function validateUUID(value: string): string | null {
  if (!value || typeof value !== "string") return "ID is required";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) return "Invalid ID format";
  return null;
}

/** Validate token name */
export function validateTokenName(value: string): string | null {
  if (!value || typeof value !== "string") return "Token name is required";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Token name is required";
  if (trimmed.length > MAX_LENGTHS.tokenName) return "Token name is too long";
  // Alphanumeric + spaces + basic punctuation
  if (!/^[a-zA-Z0-9 _\-]+$/.test(trimmed)) return "Token name contains invalid characters";
  return null;
}

// ---------- Error Sanitization ----------

/**
 * Map raw CCXT / exchange errors to safe, user-friendly messages.
 * NEVER expose raw error messages to the client — they may contain
 * internal details, IP addresses, or credential fragments.
 */
export function sanitizeExchangeError(rawError: string, exchangeName: string): string {
  const lower = rawError.toLowerCase();
  const name = exchangeName.toUpperCase();

  // Authentication errors
  if (
    lower.includes("invalid api") ||
    lower.includes("authenticationerror") ||
    lower.includes("invalid signature") ||
    lower.includes("invalid access key") ||
    lower.includes("api key") ||
    lower.includes("signature")
  ) {
    return `Invalid API key or secret for ${name}. Please double-check your credentials.`;
  }

  // Permission errors
  if (
    lower.includes("permissiondenied") ||
    lower.includes("permission") ||
    lower.includes("forbidden") ||
    lower.includes("403")
  ) {
    return `API key for ${name} lacks required permissions. Please ensure the key has read access.`;
  }

  // IP whitelist errors
  if (
    lower.includes("ip") ||
    lower.includes("whitelist") ||
    lower.includes("not allowed")
  ) {
    return `${name} API key is IP-restricted. Please add our server IP to your whitelist, or remove IP restrictions.`;
  }

  // Rate limit errors
  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("429")
  ) {
    return `${name} rate limit reached. Please wait a moment and try again.`;
  }

  // Network / timeout errors
  if (
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("network") ||
    lower.includes("fetch failed")
  ) {
    return `Could not connect to ${name}. The exchange may be experiencing issues. Please try again later.`;
  }

  // Passphrase errors
  if (
    lower.includes("passphrase") ||
    lower.includes("password")
  ) {
    return `Invalid passphrase for ${name}. Please double-check your API passphrase.`;
  }

  // Exchange maintenance
  if (
    lower.includes("maintenance") ||
    lower.includes("unavailable")
  ) {
    return `${name} is currently under maintenance. Please try again later.`;
  }

  // Generic fallback — NEVER return the raw error
  return `Failed to connect to ${name}. Please verify your API credentials and try again.`;
}

// ---------- Security Headers ----------

/** Security headers to add to all responses */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
} as const;

// ---------- Client IP ----------

/** Extract client IP from request headers (Vercel provides x-forwarded-for) */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

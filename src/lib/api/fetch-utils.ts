/**
 * API Fetch Utilities
 * Provides retry logic, timeout handling, and caching for API calls
 */

// ============================================================================
// Types
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface FetchWithRetryOptions extends RequestInit {
  timeoutMs?: number;
  retry?: RetryOptions;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  context?: Record<string, unknown>;
}

// ============================================================================
// Error Classes
// ============================================================================

export class ApiRequestError extends Error implements ApiError {
  status?: number;
  code?: string;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    options?: { status?: number; code?: string; context?: Record<string, unknown> }
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.code = options?.code;
    this.context = options?.context;
  }
}

export class TimeoutError extends ApiRequestError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, { code: "TIMEOUT", context });
    this.name = "TimeoutError";
  }
}

export class RetryExhaustedError extends ApiRequestError {
  attempts: number;
  lastError: Error;

  constructor(message: string, attempts: number, lastError: Error, context?: Record<string, unknown>) {
    super(message, { code: "RETRY_EXHAUSTED", context });
    this.name = "RetryExhaustedError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// ============================================================================
// Logging Utilities
// ============================================================================

interface LogContext {
  service?: string;
  operation?: string;
  attempt?: number;
  maxAttempts?: number;
  duration?: number;
  [key: string]: unknown;
}

function formatLogContext(context: LogContext): string {
  const parts: string[] = [];
  if (context.service) parts.push(`[${context.service}]`);
  if (context.operation) parts.push(`[${context.operation}]`);
  if (context.attempt !== undefined && context.maxAttempts !== undefined) {
    parts.push(`[attempt ${context.attempt}/${context.maxAttempts}]`);
  }
  if (context.duration !== undefined) parts.push(`[${context.duration}ms]`);

  const extraContext = Object.entries(context)
    .filter(([key]) => !["service", "operation", "attempt", "maxAttempts", "duration"].includes(key))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(" ");

  if (extraContext) parts.push(extraContext);

  return parts.join(" ");
}

export function logError(message: string, error: unknown, context?: LogContext): void {
  const contextStr = context ? formatLogContext(context) : "";
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`ERROR ${contextStr} ${message}: ${errorMessage}`);
  if (errorStack) {
    console.error(`Stack trace: ${errorStack}`);
  }
}

export function logWarn(message: string, context?: LogContext): void {
  const contextStr = context ? formatLogContext(context) : "";
  console.warn(`WARN ${contextStr} ${message}`);
}

export function logInfo(message: string, context?: LogContext): void {
  const contextStr = context ? formatLogContext(context) : "";
  console.info(`INFO ${contextStr} ${message}`);
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: (error: Error) => {
    // Retry on network errors and 5xx server errors
    if (error instanceof ApiRequestError) {
      const status = error.status;
      // Retry on server errors (5xx) but not client errors (4xx)
      return status === undefined || (status >= 500 && status < 600);
    }
    // Retry on timeout errors
    if (error instanceof TimeoutError) {
      return true;
    }
    // Retry on generic network errors
    return true;
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  // Add jitter (up to 10% of the delay) to prevent thundering herd
  const jitter = Math.random() * 0.1 * exponentialDelay;
  // Cap at maxDelayMs
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
  context?: LogContext
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const shouldRetry = opts.shouldRetry(lastError, attempt);
      const hasMoreAttempts = attempt < opts.maxAttempts;

      if (!shouldRetry || !hasMoreAttempts) {
        if (!shouldRetry) {
          logWarn(`Not retrying - error is not retryable`, {
            ...context,
            attempt,
            maxAttempts: opts.maxAttempts,
          });
        }
        throw lastError;
      }

      const delayMs = calculateBackoffDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
      logWarn(`Request failed, retrying in ${delayMs}ms`, {
        ...context,
        attempt,
        maxAttempts: opts.maxAttempts,
      });

      await sleep(delayMs);
    }
  }

  throw new RetryExhaustedError(
    `All ${opts.maxAttempts} retry attempts exhausted`,
    opts.maxAttempts,
    lastError,
    context
  );
}

// ============================================================================
// Fetch with Timeout
// ============================================================================

const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Fetch with AbortController timeout
 */
export async function fetchWithTimeout(
  url: string,
  options?: FetchWithRetryOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms`, { url });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and timeout
 */
export async function fetchWithRetry(
  url: string,
  options?: FetchWithRetryOptions,
  context?: LogContext
): Promise<Response> {
  const retryOptions = options?.retry;

  return withRetry(
    async () => {
      const response = await fetchWithTimeout(url, options);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new ApiRequestError(`HTTP ${response.status}: ${errorText}`, {
          status: response.status,
          context: { url, responseBody: errorText.slice(0, 500) },
        });
      }

      return response;
    },
    retryOptions,
    context
  );
}

// ============================================================================
// In-Memory Cache
// ============================================================================

/**
 * Simple in-memory cache with TTL support
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache
   */
  set(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the number of entries in cache
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Generate a cache key from an object
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join("&");
  return `${prefix}:${sortedParams}`;
}

// ============================================================================
// Error Response Helpers
// ============================================================================

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Format an error for API response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof ApiRequestError) {
    return {
      error: error.message,
      code: error.code,
      details: error.context,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    };
  }

  return {
    error: String(error),
  };
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return "The request timed out. Please try again.";
  }

  if (error instanceof RetryExhaustedError) {
    return "The service is temporarily unavailable. Please try again later.";
  }

  if (error instanceof ApiRequestError) {
    if (error.status === 404) {
      return "The requested resource was not found.";
    }
    if (error.status && error.status >= 500) {
      return "The service is experiencing issues. Please try again later.";
    }
    if (error.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }
  }

  return "An unexpected error occurred. Please try again.";
}

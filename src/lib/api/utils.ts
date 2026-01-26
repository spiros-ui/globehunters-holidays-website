/**
 * API Reliability Utilities
 * Shared utilities for API reliability patterns including retry logic,
 * caching, timeout handling, and cache key generation.
 */

/**
 * Options for configuring retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds between retries, used for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
}

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(message: string = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Custom error class for retry exhaustion errors
 */
export class RetryExhaustedError extends Error {
  public readonly attempts: number;
  public readonly lastError: Error;

  constructor(attempts: number, lastError: Error) {
    super(`All ${attempts} retry attempts exhausted. Last error: ${lastError.message}`);
    this.name = "RetryExhaustedError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Wraps a promise with a timeout. Rejects with TimeoutError if the promise
 * doesn't resolve within the specified time.
 *
 * @template T - The type of the promise result
 * @param promise - The promise to wrap with a timeout
 * @param ms - Timeout duration in milliseconds
 * @param errorMessage - Optional custom error message for timeout
 * @returns A promise that resolves with the original value or rejects on timeout
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   5000,
 *   'API request timed out'
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage?: string
): Promise<T> {
  if (ms <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Determines if an error is retryable based on the error type and HTTP status
 */
function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // Timeout errors are retryable
  if (error instanceof TimeoutError) {
    return true;
  }

  return true; // Default to retrying on unknown errors
}

/**
 * Determines if an HTTP response status code indicates a retryable error
 */
function isRetryableStatus(status: number): boolean {
  // Retry on server errors (5xx) and rate limiting (429)
  return status >= 500 || status === 429 || status === 408;
}

/**
 * Calculates the delay for exponential backoff with jitter
 */
function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (0-25% of the delay) to prevent thundering herd
  const jitter = exponentialDelay * Math.random() * 0.25;
  return exponentialDelay + jitter;
}

/**
 * Fetch wrapper with exponential backoff retry logic and timeout support.
 * Automatically retries failed requests with increasing delays between attempts.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch RequestInit options
 * @param retryOptions - Configuration for retry behavior
 * @returns A promise that resolves to the fetch Response
 * @throws {RetryExhaustedError} When all retry attempts are exhausted
 * @throws {TimeoutError} When a request times out (and retries are exhausted)
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry(
 *   'https://api.example.com/data',
 *   { method: 'GET', headers: { 'Authorization': 'Bearer token' } },
 *   { maxRetries: 5, baseDelay: 500, timeout: 10000 }
 * );
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelay = 1000, timeout = 15000 } = retryOptions;

  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const fetchOptions: RequestInit = {
        ...options,
        signal: options.signal || controller.signal,
      };

      // Execute fetch with timeout
      const response = await withTimeout(
        fetch(url, fetchOptions),
        timeout,
        `Request to ${url} timed out after ${timeout}ms`
      );

      // Check if response status indicates a retryable error
      if (!response.ok && isRetryableStatus(response.status)) {
        // Clone response to read body for error message
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      // Successful response (or non-retryable error status)
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries;
      const shouldRetry = !isLastAttempt && isRetryableError(lastError);

      if (!shouldRetry) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = calculateBackoffDelay(attempt, baseDelay);

      // Log retry attempt
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} for ${url} after ${Math.round(delay)}ms`);

      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new RetryExhaustedError(maxRetries + 1, lastError);
}

/**
 * Cache entry with value and expiration time
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL (Time To Live) support.
 * Automatically removes expired entries on access.
 *
 * @template T - The type of values stored in the cache
 *
 * @example
 * ```typescript
 * const cache = new SimpleCache<FlightOffer[]>(10 * 60 * 1000); // 10 minute TTL
 *
 * // Store search results
 * cache.set('search:LON-NYC-2024-03-15', flights);
 *
 * // Retrieve if not expired
 * const cached = cache.get('search:LON-NYC-2024-03-15');
 * ```
 */
export class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private defaultTTL: number;

  /**
   * Creates a new SimpleCache instance
   * @param defaultTTL - Default time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Retrieves a value from the cache if it exists and hasn't expired.
   * Automatically removes expired entries.
   *
   * @param key - The cache key to look up
   * @returns The cached value or undefined if not found/expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Stores a value in the cache with an optional custom TTL.
   *
   * @param key - The cache key
   * @param value - The value to store
   * @param ttl - Optional TTL in milliseconds (overrides default)
   */
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Checks if a key exists in the cache and hasn't expired.
   *
   * @param key - The cache key to check
   * @returns true if the key exists and is valid, false otherwise
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Removes a specific entry from the cache.
   *
   * @param key - The cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Removes all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns the number of entries in the cache (including potentially expired ones).
   * For accurate count, use after cleanup operations.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Removes all expired entries from the cache.
   * Useful for periodic cleanup to free memory.
   *
   * @returns The number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Generates a deterministic cache key from a prefix and parameters object.
 * Sorts keys to ensure consistent cache keys regardless of parameter order.
 *
 * @param prefix - A prefix to namespace the cache key (e.g., 'flights', 'hotels')
 * @param params - An object containing search parameters
 * @returns A string cache key
 *
 * @example
 * ```typescript
 * const key = generateCacheKey('flights', {
 *   origin: 'LON',
 *   destination: 'NYC',
 *   date: '2024-03-15',
 *   passengers: 2
 * });
 * // Returns: 'flights:date=2024-03-15&destination=NYC&origin=LON&passengers=2'
 * ```
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  // Filter out undefined and null values, then sort keys for consistency
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  // Build key string
  const paramsString = sortedEntries
    .map(([key, value]) => {
      // Handle arrays and objects by JSON stringifying them
      const serializedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(serializedValue)}`;
    })
    .join("&");

  return `${prefix}:${paramsString}`;
}

/**
 * Sleep utility function for delays
 *
 * @param ms - Duration to sleep in milliseconds
 * @returns A promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

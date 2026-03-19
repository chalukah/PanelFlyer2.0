/**
 * Exponential backoff retry utility with jitter.
 * Used for AI calls, gog CLI, Supabase operations, and other flaky network ops.
 */

export type RetryOptions = {
  maxRetries?: number;
  baseDelay?: number;       // ms, default 1000
  maxDelay?: number;        // ms, default 30000
  multiplier?: number;      // default 2
  signal?: AbortSignal;
  /** Return true if the error is retryable. Default: retries all except 401/403. */
  isRetryable?: (error: unknown) => boolean;
  /** Called before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
};

function defaultIsRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Don't retry auth errors
    if (msg.includes('401') || msg.includes('403') || msg.includes('invalid') && msg.includes('key')) {
      return false;
    }
    // Don't retry validation errors
    if (msg.includes('validation') || msg.includes('schema')) {
      return false;
    }
  }
  // Retry everything else (timeouts, 500s, network errors)
  return true;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    signal,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check abort before each attempt
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or non-retryable errors
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const expDelay = baseDelay * Math.pow(multiplier, attempt);
      const jitter = Math.random() * baseDelay * 0.5;
      const delay = Math.min(expDelay + jitter, maxDelay);

      onRetry?.(attempt + 1, error, delay);

      // Wait before retrying
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        if (signal) {
          const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          };
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }

  throw lastError;
}

/**
 * Convenience wrapper: retry with a simple count, no options.
 */
export async function retryN<T>(fn: () => Promise<T>, n: number): Promise<T> {
  return withRetry(fn, { maxRetries: n });
}

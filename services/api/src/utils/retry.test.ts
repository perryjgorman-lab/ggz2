import { withRetry, isRetryableHttpError } from './retry';

describe('retry utility', () => {
  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 50
        })
      ).rejects.toThrow('network error');

      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('validation error'));

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelayMs: 10,
          retryableErrors: (error) => error.message.includes('network')
        })
      ).rejects.toThrow('validation error');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 50,
        maxDelayMs: 500,
        backoffMultiplier: 2
      });
      const elapsed = Date.now() - startTime;

      // Should wait at least 50ms + 100ms = 150ms
      expect(elapsed).toBeGreaterThanOrEqual(140);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect maxDelayMs cap', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(fn, {
        maxRetries: 4,
        initialDelayMs: 50,
        maxDelayMs: 100,
        backoffMultiplier: 10
      });
      const elapsed = Date.now() - startTime;

      // Should wait 50ms + 100ms + 100ms = 250ms (capped at 100)
      expect(elapsed).toBeGreaterThanOrEqual(240);
      expect(elapsed).toBeLessThan(1000);
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('isRetryableHttpError', () => {
    it('should return true for 5xx errors', () => {
      expect(isRetryableHttpError(500)).toBe(true);
      expect(isRetryableHttpError(502)).toBe(true);
      expect(isRetryableHttpError(503)).toBe(true);
      expect(isRetryableHttpError(504)).toBe(true);
    });

    it('should return true for 429 rate limit', () => {
      expect(isRetryableHttpError(429)).toBe(true);
    });

    it('should return true for 408 timeout', () => {
      expect(isRetryableHttpError(408)).toBe(true);
    });

    it('should return false for 4xx client errors', () => {
      expect(isRetryableHttpError(400)).toBe(false);
      expect(isRetryableHttpError(401)).toBe(false);
      expect(isRetryableHttpError(403)).toBe(false);
      expect(isRetryableHttpError(404)).toBe(false);
    });

    it('should return false for 2xx success codes', () => {
      expect(isRetryableHttpError(200)).toBe(false);
      expect(isRetryableHttpError(201)).toBe(false);
      expect(isRetryableHttpError(204)).toBe(false);
    });
  });
});

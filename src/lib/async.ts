/**
 * Asynchronous concurrency and control utilities.
 */

/**
 * Execute async operations over an array with bounded concurrency.
 * Prevents socket exhaustion, spikes, and rate-limiting while maintaining throughput.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (currentIndex < items.length) {
        const idx = currentIndex++;
        results[idx] = await fn(items[idx]);
      }
    }
  );

  await Promise.all(workers);
  return results;
}

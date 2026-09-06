/** Bound waiting and always clear timers; the caller owns cancellation of I/O. */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), Math.max(0, ms)); })]);
  } finally {
    clearTimeout(timer);
  }
}

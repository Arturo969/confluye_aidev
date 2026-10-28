/** Límite local de envíos por carga de página (ADR-0003). Solo memoria: nada en storage. */
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const attempts: number[] = [];
  return {
    tryAcquire(): boolean {
      const current = now();
      while (attempts.length > 0 && current - (attempts[0] ?? 0) >= windowMs) attempts.shift();
      if (attempts.length >= max) return false;
      attempts.push(current);
      return true;
    },
  };
}

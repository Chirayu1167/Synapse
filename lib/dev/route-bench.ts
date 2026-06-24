import { cache } from "react";

/** Per-request timer for warm-route diagnostics (logs when ROUTE_BENCH=1). */
export const routeBenchTimer = cache(() => {
  const start = performance.now();
  return {
    log(route: string) {
      if (process.env.ROUTE_BENCH === "1") {
        console.log(`[route-bench] ${route}: ${(performance.now() - start).toFixed(0)}ms`);
      }
    },
  };
});

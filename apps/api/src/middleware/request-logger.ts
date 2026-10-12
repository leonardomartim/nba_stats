import type { MiddlewareHandler } from "hono";

export const requestLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = performance.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = (performance.now() - start).toFixed(1);
    const status = c.res.status;

    // Skip verbose logs for SSE heartbeats
    if (path.includes("/events/games") && status === 200) {
      return;
    }

    console.log(
      `[HTTP] ${method} ${path} -> ${status} (${duration}ms)`
    );
  };
};

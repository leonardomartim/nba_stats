import type { MiddlewareHandler } from "hono";

interface ClientBucket {
  count: number;
  resetTime: number;
}

export const rateLimiter = (options = { max: 120, windowMs: 60000 }): MiddlewareHandler => {
  const clients = new Map<string, ClientBucket>();

  return async (c, next) => {
    // Skip rate limiting for internal health check or SSE stream
    if (c.req.path === "/health" || c.req.path.includes("/events/")) {
      return next();
    }

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "local";

    const now = Date.now();
    let bucket = clients.get(ip);

    if (!bucket || now > bucket.resetTime) {
      bucket = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      clients.set(ip, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, options.max - bucket.count);
    c.header("X-RateLimit-Limit", String(options.max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(bucket.resetTime / 1000)));

    if (bucket.count > options.max) {
      return c.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        429
      );
    }

    await next();
  };
};

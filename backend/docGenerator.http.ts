/**
 * Val Town Documentation Generator
 * Main HTTP val entry point
 *
 * Provides:
 * - GET / - Documentation viewer UI
 * - GET /api/docs?val=username/valname - JSON API for documentation
 * - GET /frontend/* - Static frontend assets
 * - GET /shared/* - Shared module assets
 */

import { Hono } from "npm:hono@4.0.0";
import { serveFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { getApiDocs } from "./routes/apiDocs.ts";
import { getUI } from "./routes/ui.ts";

const app = new Hono();

// Unwrap Hono errors to see original error details
app.onError((err, c) => {
  throw err;
});

/**
 * API Routes
 */
app.get("/api/docs", getApiDocs);

/**
 * UI Routes
 */
app.get("/", getUI);

/**
 * Static File Serving
 */
app.get("/frontend/*", (c) => serveFile(c.req.path, import.meta.url));
app.get("/shared/*", (c) => serveFile(c.req.path, import.meta.url));

/**
 * Health check endpoint
 */
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: "NOT_FOUND",
      message: "Route not found",
      availableRoutes: [
        "GET /",
        "GET /api/docs?val=username/valname",
        "GET /health",
      ],
    },
    404,
  );
});

// Export the Hono app as the HTTP val entry point
export default app.fetch;

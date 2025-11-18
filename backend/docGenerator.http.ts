/**
 * Val Town Documentation Generator
 *
 * Main HTTP val entry point for the documentation generation service.
 *
 * ## Routes
 * - `GET /` - Documentation viewer UI
 * - `GET /api/docs?val=username/valname` - JSON API for documentation
 * - `GET /frontend/*` - Static frontend assets
 * - `GET /shared/*` - Shared module assets
 * - `GET /health` - Health check endpoint
 */

import { serveFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { Hono } from "npm:hono@4.0.0";
import { getApiDocs } from "./routes/apiDocs.ts";
import { getUI } from "./routes/ui.ts";

const app = new Hono();

// Unwrap Hono errors to see original error details
app.onError((err, _c) => {
  throw err;
});

// API Routes
app.get("/api/docs", getApiDocs);

// UI Routes
app.get("/", getUI);

// Static File Serving
app.get("/frontend/*", (c) => serveFile(c.req.path, import.meta.url));
app.get("/shared/*", (c) => serveFile(c.req.path, import.meta.url));

/**
 * Health check endpoint.
 *
 * @param c - Hono context
 * @returns JSON response with status and timestamp
 */
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 handler for unmatched routes.
 *
 * @param c - Hono context
 * @returns JSON error response with available routes
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

/**
 * Exports the Hono app's fetch handler as the HTTP val entry point.
 *
 * This is the default export required by Val Town for HTTP vals.
 */
export default app.fetch;

/**
 * UI routes for serving the documentation viewer
 */

import type { Context } from "npm:hono@4.0.0";
import { readFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { generateDocs, updateCachedHtml } from "../services/docService.ts";

/**
 * Render the HTML page with optional initial data
 */
async function renderIndexPage(data: {
  manifest?: unknown;
  val?: string;
  error?: string;
}): Promise<string> {
  let html = await readFile("/frontend/index.html", import.meta.url);

  // Inject initial data to avoid extra round-trips
  const dataScript = `<script>
    window.__INITIAL_DATA__ = ${JSON.stringify(data)};
  </script>`;

  html = html.replace("</head>", `${dataScript}</head>`);

  return html;
}

/**
 * GET /
 * Serves the documentation viewer UI
 */
export async function getUI(c: Context) {
  const initialVal = c.req.query("val");

  // If no val specified, show empty UI
  if (!initialVal) {
    const html = await renderIndexPage({});
    return c.html(html);
  }

  try {
    // Try to get cached docs
    const cached = await generateDocs(initialVal, { refresh: false });

    // Check if we have cached SSR HTML
    if (cached.ssrHtml) {
      return c.html(cached.ssrHtml);
    }

    // Generate HTML with initial manifest
    const html = await renderIndexPage({
      manifest: cached.manifest,
      val: initialVal,
    });

    // Cache the HTML for next time
    await updateCachedHtml(initialVal, html);

    return c.html(html);
  } catch (error) {
    console.error("[ui] Error loading docs:", error);

    // Return UI with error message
    const html = await renderIndexPage({
      val: initialVal,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return c.html(html);
  }
}

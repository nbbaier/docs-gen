/**
 * API routes for documentation generation
 */

import type { Context } from "npm:hono@4.0.0";
import { generateDocs } from "../services/docService.ts";

/**
 * GET /api/docs
 *
 * Returns documentation manifest as JSON for a given val.
 *
 * Query parameters:
 * - `val` (required): Val identifier in format "username/valname"
 * - `refresh` (optional): Set to "true" to bypass cache and regenerate docs
 *
 * @param c - Hono context object
 * @returns JSON response with documentation manifest or error details
 */
export async function getApiDocs(c: Context) {
  const val = c.req.query("val");

  if (!val) {
    return c.json(
      {
        error: "BAD_REQUEST",
        message: 'Missing required query parameter "val"',
        example: "/api/docs?val=username/valname",
      },
      400,
    );
  }

  try {
    const refresh = c.req.query("refresh") === "true";
    const { manifest } = await generateDocs(val, { refresh });

    return c.json(manifest);
  } catch (error) {
    console.error("[api-docs] Error generating docs:", error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("not found")) {
        return c.json(
          {
            error: "NOT_FOUND",
            message: error.message,
          },
          404,
        );
      }

      if (error.message.includes("Invalid val identifier")) {
        return c.json(
          {
            error: "BAD_REQUEST",
            message: error.message,
          },
          400,
        );
      }

      return c.json(
        {
          error: "INTERNAL_ERROR",
          message: error.message,
        },
        500,
      );
    }

    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      500,
    );
  }
}

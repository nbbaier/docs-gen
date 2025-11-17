/**
 * Val Town API client for fetching val metadata and source code
 * Uses the official @valtown/sdk for API interactions
 */

import ValTown from "@valtown/sdk";
import type { ValMetadata } from "../../shared/docTypes.ts";

/**
 * Represents a file in a val bundle
 */
export interface ValFile {
  path: string;
  content: string;
}

/**
 * Complete val bundle with metadata and source files
 */
export interface ValBundle {
  metadata: ValMetadata;
  files: ValFile[];
  version: string;
}

/**
 * Parse val identifier into username and val name
 */
export function parseValIdentifier(val: string): {
  username: string;
  valname: string;
} {
  const parts = val.split("/");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid val identifier "${val}". Expected format: username/valname`,
    );
  }
  return { username: parts[0], valname: parts[1] };
}

/**
 * Fetch val metadata using the official Val Town SDK
 */
async function fetchValMetadata(
  client: ValTown,
  username: string,
  valname: string,
): Promise<ValMetadata> {
  try {
    // Use the SDK's alias retrieve method to fetch val metadata
    const val = await client.alias.username.valName.retrieve(username, valname);

    // Map SDK response to our ValMetadata format
    return {
      id: val.id,
      name: val.name,
      author: {
        username: val.author?.username || username,
        id: val.author?.id || "",
      },
      version: String(val.version || "1"),
      privacy: val.privacy || "public",
      createdAt: val.createdAt,
      updatedAt: val.updatedAt,
      readme: val.readme,
    };
  } catch (error) {
    if (error instanceof ValTown.NotFoundError) {
      throw new Error(`Val not found: ${username}/${valname}`);
    }
    throw new Error(`Failed to fetch val metadata: ${error.message}`);
  }
}

/**
 * Fetch val source code using the official Val Town SDK
 */
async function fetchValSource(
  client: ValTown,
  valId: string,
): Promise<string> {
  try {
    // Use the SDK's files.getContent method to fetch val source code
    const response = await client.vals.files.getContent(valId);

    // The response is a blob/stream, convert it to text
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch val source: ${error.message}`);
  }
}

/**
 * Main Val fetcher interface
 */
export interface ValFetcher {
  fetchLatest(val: string): Promise<ValBundle>;
}

/**
 * Create a Val Town API fetcher using the official SDK
 */
export function createValFetcher(): ValFetcher {
  // Initialize the Val Town SDK client
  // The SDK automatically uses VAL_TOWN_API_KEY environment variable if available
  const client = new ValTown();

  return {
    async fetchLatest(val: string): Promise<ValBundle> {
      const { username, valname } = parseValIdentifier(val);

      // Fetch metadata first using the SDK
      const metadata = await fetchValMetadata(client, username, valname);

      // Fetch source code using the SDK
      const source = await fetchValSource(client, metadata.id);

      // For now, we treat the val as a single file
      // In the future, we could support multi-file vals/projects
      const files: ValFile[] = [
        {
          path: `${valname}.ts`,
          content: source,
        },
      ];

      return {
        metadata,
        files,
        version: metadata.version,
      };
    },
  };
}

/**
 * Default val fetcher instance
 */
export const valFetcher = createValFetcher();

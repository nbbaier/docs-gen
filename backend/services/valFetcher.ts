/**
 * Val Town API client for fetching val metadata and source code
 */

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
 * Fetch val metadata from Val Town API
 */
async function fetchValMetadata(
  username: string,
  valname: string,
): Promise<ValMetadata> {
  const url = `https://api.val.town/v1/alias/${username}/${valname}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Val not found: ${username}/${valname}`);
    }
    throw new Error(
      `Failed to fetch val metadata: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  // Map API response to our ValMetadata format
  return {
    id: data.id,
    name: data.name,
    author: {
      username: data.author?.username || username,
      id: data.author?.id || data.authorId,
    },
    version: String(data.version || "1"),
    privacy: data.privacy || "public",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    readme: data.readme,
  };
}

/**
 * Fetch val source code
 * Val Town stores code at esm.town/v/{username}/{valname}@{version}
 */
async function fetchValSource(
  username: string,
  valname: string,
  version: string,
): Promise<string> {
  // Try to fetch from esm.town
  const url = `https://esm.town/v/${username}/${valname}@${version}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch val source: ${response.status} ${response.statusText}`,
    );
  }

  return await response.text();
}

/**
 * Main Val fetcher interface
 */
export interface ValFetcher {
  fetchLatest(val: string): Promise<ValBundle>;
}

/**
 * Create a Val Town API fetcher
 */
export function createValFetcher(): ValFetcher {
  return {
    async fetchLatest(val: string): Promise<ValBundle> {
      const { username, valname } = parseValIdentifier(val);

      // Fetch metadata first
      const metadata = await fetchValMetadata(username, valname);

      // Fetch source code
      const source = await fetchValSource(username, valname, metadata.version);

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

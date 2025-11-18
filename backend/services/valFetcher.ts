/**
 * Val Town API client for fetching val metadata and source code
 * Uses the official @valtown/sdk for API interactions
 */
``;

import ValTown from "npm:@valtown/sdk@latest";
import type { ValMetadata } from "../../shared/docTypes.ts";

// type Val

/**
 * Represents a file in a val bundle
 */
export interface ValFile {
  /** File path relative to val root */
  path: string;
  /** File content as string */
  content: string;
}

/**
 * Complete val bundle with metadata and source files.
 */
export interface ValBundle {
  /** Val version identifier */
  version: string;
  /** Val metadata from Val Town API */
  metadata: ValMetadata;
  /** Array of source files in the val */
  files: ValFile[];
}

/**
 * Parses a val identifier string into username and val name components.
 *
 * @param val - Val identifier in format "username/valname"
 * @returns Object with username and valname properties
 * @throws Error if val identifier format is invalid
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
 * Fetches val metadata using the official Val Town SDK.
 *
 * @param client - Val Town SDK client instance
 * @param username - Username of the val owner
 * @param valname - Name of the val
 * @returns Val metadata object
 * @throws Error if val is not found or fetch fails
 */
export async function fetchValMetadata(
  client: ValTown,
  username: string,
  valname: string,
): Promise<ValMetadata> {
  try {
    // Use the SDK's alias retrieve method to fetch val metadata
    console.log(
      `[valFetchr] calling client.alias.username.valName.retrieve(${valname}, {
     username: ${username}`,
    );
    const val = await client.alias.username.valName.retrieve(valname, {
      username,
    });

    return {
      id: val.id,
      name: val.name,
      author: {
        username: val.author?.username || username,
        id: val.author?.id || "",
        type: val.author?.type || "user",
      },
      links: {
        html: val.links.html,
        self: val.links.self,
      },
      description: val.description || "",
      imageUrl: val.imageUrl || "",
      privacy: val.privacy || "public",
      createdAt: val.createdAt || "",
    };
  } catch (error) {
    if (error instanceof ValTown.NotFoundError) {
      throw new Error(`Val not found: ${username}/${valname}`);
    }
    throw new Error(`Failed to fetch val metadata: ${error.message}`);
  }
}

/**
 * Retrieves the list of file paths in a val.
 *
 * @param client - Val Town SDK client instance
 * @param valMetadata - Val metadata containing the val ID
 * @returns Array of file paths
 */
async function getValFiles(
  client: ValTown,
  valMetadata: ValMetadata,
): Promise<string[]> {
  const files = [];
  for await (const file of client.vals.files.retrieve(valMetadata.id, {
    limit: 1,
    offset: 0,
    path: "",
    recursive: true,
  })) {
    if (file.type !== "directory") {
      files.push(file.path);
    }
  }
  return files;
}

/**
 * Fetches the source code content for a specific file in a val.
 *
 * @param client - Val Town SDK client instance
 * @param valId - Val ID
 * @param filePath - Path to the file within the val
 * @returns File content as string
 * @throws Error if file fetch fails
 */
async function fetchFileSource(
  client: ValTown,
  valId: string,
  filePath: string,
): Promise<string> {
  try {
    const response = await client.vals.files.getContent(valId, {
      path: filePath,
    });

    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch val source: ${error.message}`);
  }
}

/**
 * Interface for fetching val bundles from Val Town.
 */
export interface ValFetcher {
  /**
   * Fetches the latest version of a val bundle.
   *
   * @param val - Val identifier in format "username/valname"
   * @returns Complete val bundle with metadata and files
   */
  fetchLatest(val: string): Promise<ValBundle>;
}

/**
 * Creates a Val Town API fetcher instance using the official SDK.
 *
 * @returns Configured ValFetcher instance
 */
export function createValFetcher(): ValFetcher {
  const client = new ValTown();

  return {
    async fetchLatest(val: string): Promise<ValBundle> {
      const { username, valname } = parseValIdentifier(val);
      const metadata = await fetchValMetadata(client, username, valname);
      const fileList = await getValFiles(client, metadata);
      const files: ValFile[] = [];

      for (const filePath of fileList) {
        const content = await fetchFileSource(client, metadata.id, filePath);
        files.push({
          path: filePath,
          content,
        });
      }

      return {
        metadata,
        files,
        version: new Date().toISOString(),
      };
    },
  };
}

/**
 * Default val fetcher instance for use throughout the application.
 */
export const valFetcher = createValFetcher();

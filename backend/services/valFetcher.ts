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
	path: string;
	content: string;
}

/**
 * Complete val bundle with metadata and source files
 */
export interface ValBundle {
	metadata: ValMetadata;
	files: ValFile[];
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

		// id: string;
		// author: Val.Author;
		// createdAt: string;
		// description: string | null;
		// /**
		//  * The URL of this val's image
		//  */
		// imageUrl: string | null;
		// links: Val.Links;
		// name: string;
		// /**
		//  * This resource's privacy setting. Unlisted resources do not appear on profile
		//  * pages or elsewhere, but you can link to them.
		//  */
		// privacy: "public" | "unlisted" | "private";
		// Map SDK response to our ValMetadata format
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
 * Fetch the source code for a given file
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
 * Main Val fetcher interface
 */
export interface ValFetcher {
	fetchLatest(val: string): Promise<ValBundle>;
}

/**
 * Create a Val Town API fetcher using the official SDK
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
			};
		},
	};
}

/**
 * Default val fetcher instance
 */
export const valFetcher = createValFetcher();

import ValTown from "npm:@valtown/sdk@latest";

const client = new ValTown();
type Val = Awaited<ReturnType<typeof client.alias.username.valName.retrieve>>;

/**
 * Shared documentation types for Val Town documentation generator
 * These types form the contract between the backend parser and frontend UI
 */

/**
 * JSDoc-style comment information
 */
export interface DocComment {
	/** Raw comment text */
	raw: string;
	/** Parsed description */
	description: string;
	/** @param tags */
	params?: Array<{ name: string; type?: string; description: string }>;
	/** @returns tag */
	returns?: { type?: string; description: string };
	/** @example tags */
	examples?: string[];
	/** @deprecated tag */
	deprecated?: string;
	/** Other tags */
	tags?: Array<{ name: string; value: string }>;
}

/**
 * Parameter information for functions and methods
 */
export interface ParameterDoc {
	name: string;
	type: string;
	optional: boolean;
	defaultValue?: string;
	description?: string;
}

/**
 * Function or method documentation
 */
export interface FunctionDoc {
	kind: "function";
	name: string;
	signature: string;
	parameters: ParameterDoc[];
	returnType: string;
	isAsync: boolean;
	isExported: boolean;
	comment?: DocComment;
	location: { line: number; file: string };
}

/**
 * Class property documentation
 */
export interface PropertyDoc {
	name: string;
	type: string;
	isReadonly: boolean;
	isOptional: boolean;
	visibility: "public" | "private" | "protected";
	comment?: DocComment;
}

/**
 * Class method documentation
 */
export interface MethodDoc {
	name: string;
	signature: string;
	parameters: ParameterDoc[];
	returnType: string;
	isAsync: boolean;
	isStatic: boolean;
	visibility: "public" | "private" | "protected";
	comment?: DocComment;
}

/**
 * Class documentation
 */
export interface ClassDoc {
	kind: "class";
	name: string;
	isExported: boolean;
	isAbstract: boolean;
	extends?: string;
	implements?: string[];
	properties: PropertyDoc[];
	methods: MethodDoc[];
	constructor?: {
		parameters: ParameterDoc[];
		comment?: DocComment;
	};
	comment?: DocComment;
	location: { line: number; file: string };
}

/**
 * Interface property documentation
 */
export interface InterfacePropertyDoc {
	name: string;
	type: string;
	isOptional: boolean;
	isReadonly: boolean;
	comment?: DocComment;
}

/**
 * Interface method documentation
 */
export interface InterfaceMethodDoc {
	name: string;
	signature: string;
	parameters: ParameterDoc[];
	returnType: string;
	comment?: DocComment;
}

/**
 * Interface documentation
 */
export interface InterfaceDoc {
	kind: "interface";
	name: string;
	isExported: boolean;
	extends?: string[];
	properties: InterfacePropertyDoc[];
	methods: InterfaceMethodDoc[];
	comment?: DocComment;
	location: { line: number; file: string };
}

/**
 * Type alias documentation
 */
export interface TypeAliasDoc {
	kind: "type";
	name: string;
	type: string;
	isExported: boolean;
	comment?: DocComment;
	location: { line: number; file: string };
}

/**
 * Constant/variable documentation
 */
export interface ConstantDoc {
	kind: "constant";
	name: string;
	type: string;
	value?: string;
	isExported: boolean;
	comment?: DocComment;
	location: { line: number; file: string };
}

/**
 * Import statement information
 */
export interface ImportInfo {
	source: string;
	imports: Array<{
		name: string;
		alias?: string;
		isDefault?: boolean;
		isNamespace?: boolean;
	}>;
	location: { line: number; file: string };
}

/**
 * Val metadata from Val Town API
 */
export interface ValMetadata {
	id: string;
	author: { id: string; type: "user" | "org"; username: string | null };
	createdAt: string;
	description: string | null;
	/**
	 * The URL of this val's image
	 */
	imageUrl: string | null;
	links: { html: string; self: string };
	name: string;
	/**
	 * This resource's privacy setting. Unlisted resources do not appear on profile
	 * pages or elsewhere, but you can link to them.
	 */
	privacy: "public" | "unlisted" | "private";
}

/**
 * Main documentation manifest
 * This is the primary output of the parser and input to the UI
 */
export interface DocManifest {
	/** Val identifier (e.g., "username/valname") */
	val: string;
	/** Val version */
	version: string;
	/** ISO timestamp of generation */
	generatedAt: string;
	/** Parsed exports organized by kind */
	exports: {
		functions: FunctionDoc[];
		classes: ClassDoc[];
		interfaces: InterfaceDoc[];
		types: TypeAliasDoc[];
		constants: ConstantDoc[];
	};
	/** Import statements found in the val */
	imports: ImportInfo[];
	/** Metadata from Val Town API */
	metadata: ValMetadata;
}

/**
 * Type guard to check if value is a DocManifest
 */
export function isDocManifest(value: unknown): value is DocManifest {
	if (!value || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;

	return (
		typeof obj.val === "string" &&
		typeof obj.version === "string" &&
		typeof obj.generatedAt === "string" &&
		typeof obj.exports === "object" &&
		obj.exports !== null &&
		Array.isArray((obj.exports as Record<string, unknown>).functions) &&
		Array.isArray((obj.exports as Record<string, unknown>).classes) &&
		Array.isArray((obj.exports as Record<string, unknown>).interfaces) &&
		Array.isArray((obj.exports as Record<string, unknown>).types) &&
		Array.isArray((obj.exports as Record<string, unknown>).constants) &&
		Array.isArray(obj.imports) &&
		typeof obj.metadata === "object" &&
		obj.metadata !== null
	);
}

/**
 * Runtime validation that throws if value is not a DocManifest
 */
export function assertDocManifest(data: unknown): asserts data is DocManifest {
	if (!isDocManifest(data)) {
		throw new Error("Invalid DocManifest structure");
	}
}

/**
 * Creates an empty DocManifest template
 */
export function createEmptyManifest(
	val: string,
	version: string,
	metadata: ValMetadata,
): DocManifest {
	return {
		val,
		version,
		generatedAt: new Date().toISOString(),
		exports: {
			functions: [],
			classes: [],
			interfaces: [],
			types: [],
			constants: [],
		},
		imports: [],
		metadata,
	};
}

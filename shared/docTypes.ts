/**
 * Shared documentation types for Val Town documentation generator
 * These types form the contract between the backend parser and frontend UI
 */

/**
 * Parsed JSDoc-style comment information extracted from TypeScript source.
 */
export interface DocComment {
  /** Raw comment text as it appears in source */
  raw: string;
  /** Parsed description text (main comment body) */
  description: string;
  /** Array of @param tag entries */
  params?: Array<{ name: string; type?: string; description: string }>;
  /** @returns tag information */
  returns?: { type?: string; description: string };
  /** Array of @example tag values */
  examples?: string[];
  /** @deprecated tag message, if present */
  deprecated?: string;
  /** Other custom JSDoc tags */
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Documentation for a function or method parameter.
 */
export interface ParameterDoc {
  /** Parameter name */
  name: string;
  /** Type annotation as string */
  type: string;
  /** Whether the parameter is optional */
  optional: boolean;
  /** Default value expression, if present */
  defaultValue?: string;
  /** Description from JSDoc @param tag, if present */
  description?: string;
}

/**
 * Documentation for a function or arrow function export.
 */
export interface FunctionDoc {
  /** Discriminator: always "function" */
  kind: "function";
  /** Function name */
  name: string;
  /** Full function signature as string */
  signature: string;
  /** Array of parameter documentation */
  parameters: ParameterDoc[];
  /** Return type annotation as string */
  returnType: string;
  /** Whether the function is async */
  isAsync: boolean;
  /** Whether the function is exported */
  isExported: boolean;
  /** JSDoc comment, if present */
  comment?: DocComment;
  /** Source location information */
  location: { line: number; file: string };
}

/**
 * Documentation for a class property.
 */
export interface PropertyDoc {
  /** Property name */
  name: string;
  /** Type annotation as string */
  type: string;
  /** Whether the property is readonly */
  isReadonly: boolean;
  /** Whether the property is optional */
  isOptional: boolean;
  /** Property visibility modifier */
  visibility: "public" | "private" | "protected";
  /** JSDoc comment, if present */
  comment?: DocComment;
}

/**
 * Documentation for a class method.
 */
export interface MethodDoc {
  /** Method name */
  name: string;
  /** Full method signature as string */
  signature: string;
  /** Array of parameter documentation */
  parameters: ParameterDoc[];
  /** Return type annotation as string */
  returnType: string;
  /** Whether the method is async */
  isAsync: boolean;
  /** Whether the method is static */
  isStatic: boolean;
  /** Method visibility modifier */
  visibility: "public" | "private" | "protected";
  /** JSDoc comment, if present */
  comment?: DocComment;
}

/**
 * Documentation for a class declaration.
 */
export interface ClassDoc {
  /** Discriminator: always "class" */
  kind: "class";
  /** Class name */
  name: string;
  /** Whether the class is exported */
  isExported: boolean;
  /** Whether the class is abstract */
  isAbstract: boolean;
  /** Base class name, if extends clause present */
  extends?: string;
  /** Array of interface names, if implements clause present */
  implements?: string[];
  /** Array of property documentation */
  properties: PropertyDoc[];
  /** Array of method documentation */
  methods: MethodDoc[];
  /** Constructor documentation, if present */
  constructor?: {
    parameters: ParameterDoc[];
    comment?: DocComment;
  };
  /** JSDoc comment, if present */
  comment?: DocComment;
  /** Source location information */
  location: { line: number; file: string };
}

/**
 * Documentation for an interface property.
 */
export interface InterfacePropertyDoc {
  /** Property name */
  name: string;
  /** Type annotation as string */
  type: string;
  /** Whether the property is optional */
  isOptional: boolean;
  /** Whether the property is readonly */
  isReadonly: boolean;
  /** JSDoc comment, if present */
  comment?: DocComment;
}

/**
 * Documentation for an interface method signature.
 */
export interface InterfaceMethodDoc {
  /** Method name */
  name: string;
  /** Full method signature as string */
  signature: string;
  /** Array of parameter documentation */
  parameters: ParameterDoc[];
  /** Return type annotation as string */
  returnType: string;
  /** JSDoc comment, if present */
  comment?: DocComment;
}

/**
 * Documentation for an interface declaration.
 */
export interface InterfaceDoc {
  /** Discriminator: always "interface" */
  kind: "interface";
  /** Interface name */
  name: string;
  /** Whether the interface is exported */
  isExported: boolean;
  /** Array of extended interface names, if extends clause present */
  extends?: string[];
  /** Array of property documentation */
  properties: InterfacePropertyDoc[];
  /** Array of method documentation */
  methods: InterfaceMethodDoc[];
  /** JSDoc comment, if present */
  comment?: DocComment;
  /** Source location information */
  location: { line: number; file: string };
}

/**
 * Documentation for a type alias declaration.
 */
export interface TypeAliasDoc {
  /** Discriminator: always "type" */
  kind: "type";
  /** Type alias name */
  name: string;
  /** Type definition as string */
  type: string;
  /** Whether the type alias is exported */
  isExported: boolean;
  /** JSDoc comment, if present */
  comment?: DocComment;
  /** Source location information */
  location: { line: number; file: string };
}

/**
 * Documentation for a constant or variable declaration.
 */
export interface ConstantDoc {
  /** Discriminator: always "constant" */
  kind: "constant";
  /** Constant name */
  name: string;
  /** Type annotation as string */
  type: string;
  /** Initializer value as string, if present */
  value?: string;
  /** Whether the constant is exported */
  isExported: boolean;
  /** JSDoc comment, if present */
  comment?: DocComment;
  /** Source location information */
  location: { line: number; file: string };
}

/**
 * Information about an import statement.
 */
export interface ImportInfo {
  /** Module source path/URL */
  source: string;
  /** Array of imported items */
  imports: Array<{
    /** Imported name */
    name: string;
    /** Alias name, if imported with `as` */
    alias?: string;
    /** Whether this is a default import */
    isDefault?: boolean;
    /** Whether this is a namespace import (`import * as ...`) */
    isNamespace?: boolean;
  }>;
  /** Source location information */
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
 * Type guard to check if a value is a valid DocManifest.
 *
 * @param value - Value to check
 * @returns True if value is a DocManifest, false otherwise
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
 * Runtime validation that throws if value is not a DocManifest.
 *
 * @param data - Value to validate
 * @throws Error if value is not a valid DocManifest
 */
export function assertDocManifest(data: unknown): asserts data is DocManifest {
  if (!isDocManifest(data)) {
    throw new Error("Invalid DocManifest structure");
  }
}

/**
 * Creates an empty DocManifest template with provided metadata.
 *
 * @param val - Val identifier in format "username/valname"
 * @param version - Val version identifier
 * @param metadata - Val metadata from Val Town API
 * @returns Empty DocManifest with initialized structure
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

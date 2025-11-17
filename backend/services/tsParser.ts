/**
 * TypeScript AST parser for extracting documentation
 * Uses the TypeScript Compiler API to walk the AST and extract exports
 */

import ts from "npm:typescript@5.3.3";
import type {
	ClassDoc,
	ConstantDoc,
	DocComment,
	DocManifest,
	FunctionDoc,
	ImportInfo,
	InterfaceDoc,
	InterfaceMethodDoc,
	InterfacePropertyDoc,
	MethodDoc,
	ParameterDoc,
	PropertyDoc,
	TypeAliasDoc,
} from "../../shared/docTypes.ts";
import { createEmptyManifest } from "../../shared/docTypes.ts";
import type { ValBundle } from "./valFetcher.ts";

/**
 * Parse JSDoc comment from a node
 */
function parseJSDocComment(
	node: ts.Node,
	sourceFile: ts.SourceFile,
): DocComment | undefined {
	const jsDocTags = ts.getJSDocTags(node);
	const jsDocComments = (node as { jsDoc?: ts.JSDoc[] }).jsDoc;

	if (!jsDocComments || jsDocComments.length === 0) {
		return undefined;
	}

	const comment = jsDocComments[0];
	const commentText = comment.comment;
	const description =
		typeof commentText === "string"
			? commentText
			: commentText
				? commentText.map((part) => part.text).join("")
				: "";

	const docComment: DocComment = {
		raw: comment.getText(sourceFile),
		description: description.trim(),
	};

	// Parse @param tags
	const paramTags = jsDocTags.filter((tag) => tag.tagName.text === "param");
	if (paramTags.length > 0) {
		docComment.params = paramTags.map((tag) => {
			const paramTag = tag as ts.JSDocParameterTag;
			const name = paramTag.name ? paramTag.name.getText(sourceFile) : "";
			const desc = typeof tag.comment === "string" 
				? tag.comment 
				: tag.comment 
					? tag.comment.map((part) => part.text).join("") 
					: "";
			return {
				name,
				type: undefined,
				description: desc.trim().replace(/^-\s*/, ""), // Remove leading dash
			};
		});
	}

	// Parse @returns tag
	const returnTag = jsDocTags.find((tag) => tag.tagName.text === "returns");
	if (returnTag?.comment) {
		docComment.returns = {
			description: String(returnTag.comment),
		};
	}

	// Parse @example tags
	const exampleTags = jsDocTags.filter((tag) => tag.tagName.text === "example");
	if (exampleTags.length > 0) {
		docComment.examples = exampleTags.map((tag) =>
			tag.comment ? String(tag.comment) : "",
		);
	}

	// Parse @deprecated tag
	const deprecatedTag = jsDocTags.find(
		(tag) => tag.tagName.text === "deprecated",
	);
	if (deprecatedTag) {
		docComment.deprecated = deprecatedTag.comment
			? String(deprecatedTag.comment)
			: "This is deprecated";
	}

	return docComment;
}

/**
 * Get type as string from type node
 */
function getTypeString(
	typeNode: ts.TypeNode | undefined,
	_checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): string {
	if (!typeNode) return "any";
	return typeNode.getText(sourceFile);
}

/**
 * Parse parameter documentation
 */
function parseParameters(
	parameters: ts.NodeArray<ts.ParameterDeclaration>,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): ParameterDoc[] {
	return parameters.map((param) => {
		const name = param.name.getText(sourceFile);
		const type = getTypeString(param.type, checker, sourceFile);
		const optional = !!param.questionToken || !!param.initializer;
		const defaultValue = param.initializer?.getText(sourceFile);

		return {
			name,
			type,
			optional,
			defaultValue,
		};
	});
}

/**
 * Parse function declaration or expression
 */
function parseFunctionDeclaration(
	node: ts.FunctionDeclaration | ts.VariableStatement,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): FunctionDoc | null {
	let funcDecl:
		| ts.FunctionDeclaration
		| ts.ArrowFunction
		| ts.FunctionExpression;
	let name: string;
	let isExported = false;

	if (ts.isFunctionDeclaration(node)) {
		funcDecl = node;
		name = node.name?.getText(sourceFile) || "anonymous";
		isExported = !!node.modifiers?.some(
			(m) => m.kind === ts.SyntaxKind.ExportKeyword,
		);
	} else if (ts.isVariableStatement(node)) {
		// Handle: export const foo = () => {}
		isExported = !!node.modifiers?.some(
			(m) => m.kind === ts.SyntaxKind.ExportKeyword,
		);

		const declaration = node.declarationList.declarations[0];
		if (!declaration?.initializer) return null;

		if (
			!ts.isArrowFunction(declaration.initializer) &&
			!ts.isFunctionExpression(declaration.initializer)
		) {
			return null;
		}

		funcDecl = declaration.initializer;
		name = declaration.name.getText(sourceFile);
	} else {
		return null;
	}

	const signature = funcDecl.getText(sourceFile);
	const parameters = parseParameters(funcDecl.parameters, checker, sourceFile);
	const returnType = getTypeString(funcDecl.type, checker, sourceFile);
	const isAsync = !!funcDecl.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.AsyncKeyword,
	);
	const comment = parseJSDocComment(node, sourceFile);
	const line =
		sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

	return {
		kind: "function",
		name,
		signature,
		parameters,
		returnType,
		isAsync,
		isExported,
		comment,
		location: { line, file: sourceFile.fileName },
	};
}

/**
 * Parse class property
 */
function parseProperty(
	node: ts.PropertyDeclaration,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): PropertyDoc {
	const name = node.name.getText(sourceFile);
	const type = getTypeString(node.type, checker, sourceFile);
	const isReadonly = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.ReadonlyKeyword,
	);
	const isOptional = !!node.questionToken;

	let visibility: "public" | "private" | "protected" = "public";
	if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {
		visibility = "private";
	} else if (
		node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)
	) {
		visibility = "protected";
	}

	const comment = parseJSDocComment(node, sourceFile);

	return {
		name,
		type,
		isReadonly,
		isOptional,
		visibility,
		comment,
	};
}

/**
 * Parse class method
 */
function parseMethod(
	node: ts.MethodDeclaration,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): MethodDoc {
	const name = node.name.getText(sourceFile);
	const signature = node.getText(sourceFile);
	const parameters = parseParameters(node.parameters, checker, sourceFile);
	const returnType = getTypeString(node.type, checker, sourceFile);
	const isAsync = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.AsyncKeyword,
	);
	const isStatic = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.StaticKeyword,
	);

	let visibility: "public" | "private" | "protected" = "public";
	if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {
		visibility = "private";
	} else if (
		node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword)
	) {
		visibility = "protected";
	}

	const comment = parseJSDocComment(node, sourceFile);

	return {
		name,
		signature,
		parameters,
		returnType,
		isAsync,
		isStatic,
		visibility,
		comment,
	};
}

/**
 * Parse class declaration
 */
function parseClassDeclaration(
	node: ts.ClassDeclaration,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): ClassDoc | null {
	const name = node.name?.getText(sourceFile);
	if (!name) return null;

	const isExported = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.ExportKeyword,
	);
	const isAbstract = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.AbstractKeyword,
	);

	const extendsClause = node.heritageClauses?.find(
		(c) => c.token === ts.SyntaxKind.ExtendsKeyword,
	);
	const extendsType = extendsClause?.types[0]?.getText(sourceFile);

	const implementsClause = node.heritageClauses?.find(
		(c) => c.token === ts.SyntaxKind.ImplementsKeyword,
	);
	const implementsTypes = implementsClause?.types.map((t) =>
		t.getText(sourceFile),
	);

	const properties: PropertyDoc[] = [];
	const methods: MethodDoc[] = [];
	// biome-ignore lint/suspicious/noShadowRestrictedNames: constructor is a reserved word
	let constructor: ClassDoc["constructor"];

	for (const member of node.members) {
		if (ts.isPropertyDeclaration(member)) {
			properties.push(parseProperty(member, checker, sourceFile));
		} else if (ts.isMethodDeclaration(member)) {
			methods.push(parseMethod(member, checker, sourceFile));
		} else if (ts.isConstructorDeclaration(member)) {
			constructor = {
				parameters: parseParameters(member.parameters, checker, sourceFile),
				comment: parseJSDocComment(member, sourceFile),
			};
		}
	}

	const comment = parseJSDocComment(node, sourceFile);
	const line =
		sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

	return {
		kind: "class",
		name,
		isExported,
		isAbstract,
		extends: extendsType,
		implements: implementsTypes,
		properties,
		methods,
		constructor,
		comment,
		location: { line, file: sourceFile.fileName },
	};
}

/**
 * Parse interface property
 */
function parseInterfaceProperty(
	node: ts.PropertySignature,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): InterfacePropertyDoc {
	const name = node.name.getText(sourceFile);
	const type = getTypeString(node.type, checker, sourceFile);
	const isOptional = !!node.questionToken;
	const isReadonly = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.ReadonlyKeyword,
	);
	const comment = parseJSDocComment(node, sourceFile);

	return {
		name,
		type,
		isOptional,
		isReadonly,
		comment,
	};
}

/**
 * Parse interface method
 */
function parseInterfaceMethod(
	node: ts.MethodSignature,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): InterfaceMethodDoc {
	const name = node.name.getText(sourceFile);
	const signature = node.getText(sourceFile);
	const parameters = parseParameters(node.parameters, checker, sourceFile);
	const returnType = getTypeString(node.type, checker, sourceFile);
	const comment = parseJSDocComment(node, sourceFile);

	return {
		name,
		signature,
		parameters,
		returnType,
		comment,
	};
}

/**
 * Parse interface declaration
 */
function parseInterfaceDeclaration(
	node: ts.InterfaceDeclaration,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): InterfaceDoc {
	const name = node.name.getText(sourceFile);
	const isExported = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.ExportKeyword,
	);

	const extendsTypes = node.heritageClauses
		?.find((c) => c.token === ts.SyntaxKind.ExtendsKeyword)
		?.types.map((t) => t.getText(sourceFile));

	const properties: InterfacePropertyDoc[] = [];
	const methods: InterfaceMethodDoc[] = [];

	for (const member of node.members) {
		if (ts.isPropertySignature(member)) {
			properties.push(parseInterfaceProperty(member, checker, sourceFile));
		} else if (ts.isMethodSignature(member)) {
			methods.push(parseInterfaceMethod(member, checker, sourceFile));
		}
	}

	const comment = parseJSDocComment(node, sourceFile);
	const line =
		sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

	return {
		kind: "interface",
		name,
		isExported,
		extends: extendsTypes,
		properties,
		methods,
		comment,
		location: { line, file: sourceFile.fileName },
	};
}

/**
 * Parse type alias declaration
 */
function parseTypeAliasDeclaration(
	node: ts.TypeAliasDeclaration,
	_checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): TypeAliasDoc {
	const name = node.name.getText(sourceFile);
	const type = node.type.getText(sourceFile);
	const isExported = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.ExportKeyword,
	);
	const comment = parseJSDocComment(node, sourceFile);
	const line =
		sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

	return {
		kind: "type",
		name,
		type,
		isExported,
		comment,
		location: { line, file: sourceFile.fileName },
	};
}

/**
 * Parse constant/variable declaration
 */
function parseConstantDeclaration(
	node: ts.VariableStatement,
	checker: ts.TypeChecker,
	sourceFile: ts.SourceFile,
): ConstantDoc | null {
	const declaration = node.declarationList.declarations[0];
	if (!declaration) return null;

	// Skip if this is actually a function (handled elsewhere)
	if (
		declaration.initializer &&
		(ts.isArrowFunction(declaration.initializer) ||
			ts.isFunctionExpression(declaration.initializer))
	) {
		return null;
	}

	const name = declaration.name.getText(sourceFile);
	const type = declaration.type
		? getTypeString(declaration.type, checker, sourceFile)
		: checker.typeToString(checker.getTypeAtLocation(declaration));
	const value = declaration.initializer?.getText(sourceFile);
	const isExported = !!node.modifiers?.some(
		(m) => m.kind === ts.SyntaxKind.ExportKeyword,
	);
	const comment = parseJSDocComment(node, sourceFile);
	const line =
		sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

	return {
		kind: "constant",
		name,
		type,
		value,
		isExported,
		comment,
		location: { line, file: sourceFile.fileName },
	};
}

/**
 * Parse import declaration
 */
function parseImportDeclaration(
	node: ts.ImportDeclaration,
	sourceFile: ts.SourceFile,
): ImportInfo {
	const source = (node.moduleSpecifier as ts.StringLiteral).text;
	const imports: ImportInfo["imports"] = [];

	if (node.importClause) {
		// Default import
		if (node.importClause.name) {
			imports.push({
				name: node.importClause.name.getText(sourceFile),
				isDefault: true,
			});
		}

		// Named imports
		if (node.importClause.namedBindings) {
			if (ts.isNamespaceImport(node.importClause.namedBindings)) {
				// import * as foo
				imports.push({
					name: node.importClause.namedBindings.name.getText(sourceFile),
					isNamespace: true,
				});
			} else if (ts.isNamedImports(node.importClause.namedBindings)) {
				// import { a, b as c }
				for (const element of node.importClause.namedBindings.elements) {
					imports.push({
						name: element.name.getText(sourceFile),
						alias: element.propertyName?.getText(sourceFile),
					});
				}
			}
		}
	}

	const line =
		sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

	return {
		source,
		imports,
		location: { line, file: sourceFile.fileName },
	};
}

/**
 * Parse a Val bundle and extract documentation
 */
export function parseValBundle(bundle: ValBundle): DocManifest {
	const manifest = createEmptyManifest(
		`${bundle.metadata.author.username}/${bundle.metadata.name}`,
		new Date().toISOString(), // version
		bundle.metadata,
	);

	// Create an in-memory compiler host
	const files = new Map<string, string>();
	for (const file of bundle.files) {
		files.set(file.path, file.content);
	}

	const compilerOptions: ts.CompilerOptions = {
		target: 6, // ES2020
		module: 99, // ESNext
		lib: ["lib.es2020.d.ts", "lib.dom.d.ts"],
		allowJs: true,
		checkJs: false,
		strict: false,
	};

	const compilerHost: ts.CompilerHost = {
		getSourceFile: (fileName) => {
			const content = files.get(fileName);
			if (content !== undefined) {
				return ts.createSourceFile(
					fileName,
					content,
					6, // ES2020
					true,
				);
			}
			return undefined;
		},
		writeFile: () => {},
		getCurrentDirectory: () => "/",
		getDirectories: () => [],
		fileExists: (fileName) => files.has(fileName),
		readFile: (fileName) => files.get(fileName),
		getCanonicalFileName: (fileName) => fileName,
		useCaseSensitiveFileNames: () => true,
		getNewLine: () => "\n",
		getDefaultLibFileName: (options) => ts.getDefaultLibFileName(options),
	};

	// Create program
	const program = ts.createProgram(
		Array.from(files.keys()),
		compilerOptions,
		compilerHost,
	);
	const checker = program.getTypeChecker();

	// Walk AST for each file
	for (const sourceFile of program.getSourceFiles()) {
		if (!files.has(sourceFile.fileName)) continue;

		ts.forEachChild(sourceFile, (node) => {
			// Functions
			if (ts.isFunctionDeclaration(node)) {
				const func = parseFunctionDeclaration(node, checker, sourceFile);
				if (func) manifest.exports.functions.push(func);
			}

			// Variable statements (might be functions or constants)
			if (ts.isVariableStatement(node)) {
				const func = parseFunctionDeclaration(node, checker, sourceFile);
				if (func) {
					manifest.exports.functions.push(func);
				} else {
					const constant = parseConstantDeclaration(node, checker, sourceFile);
					if (constant) manifest.exports.constants.push(constant);
				}
			}

			// Classes
			if (ts.isClassDeclaration(node)) {
				const cls = parseClassDeclaration(node, checker, sourceFile);
				if (cls) manifest.exports.classes.push(cls);
			}

			// Interfaces
			if (ts.isInterfaceDeclaration(node)) {
				const iface = parseInterfaceDeclaration(node, checker, sourceFile);
				manifest.exports.interfaces.push(iface);
			}

			// Type aliases
			if (ts.isTypeAliasDeclaration(node)) {
				const type = parseTypeAliasDeclaration(node, checker, sourceFile);
				manifest.exports.types.push(type);
			}

			// Imports
			if (ts.isImportDeclaration(node)) {
				const imp = parseImportDeclaration(node, sourceFile);
				manifest.imports.push(imp);
			}
		});
	}

	return manifest;
}

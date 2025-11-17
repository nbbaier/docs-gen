# Val Town Documentation Generator - Technical Plan

## Overview

Build a tool that allows users to point at any Val Town val and get automatically generated, nicely formatted API reference documentation from TypeScript type definitions and JSDoc/TSDoc comments.

## Goals

-  **Primary**: Enable one-click documentation generation for any public val
-  **Secondary**: Make the docs look professional and modern
-  **Tertiary**: Support Val Town-specific features (val metadata, runtime info, etc.)

## Non-Goals (v1)

-  Private val documentation (authentication complexities)
-  Multi-val project documentation (start with single-val scope)
-  Interactive API playground
-  Version history/changelog generation

## Architecture

### High-Level Flow

```
User Input (val identifier)
  → Fetch val source code via Val Town API
  → Parse TypeScript AST
  → Extract exports + JSDoc comments
  → Transform to documentation data structure
  → Render as HTML/React UI
  → Cache result
```

### Component Breakdown

#### 1. Main HTTP Val (`docGenerator`)

-  **Type**: HTTP val
-  **Purpose**: Entry point that orchestrates the entire flow
-  **Responsibilities**:
   -  Accept val identifier via query param (`?val=username/valname`)
   -  Coordinate fetching, parsing, and rendering
   -  Handle errors gracefully
   -  Implement caching strategy

#### 2. Val Fetcher Module (`valFetcher`)

-  **Type**: Script val (library)
-  **Purpose**: Fetch val source code and metadata
-  **Responsibilities**:
   -  Use Val Town REST API to fetch val details
   -  Handle multi-file vals (return all .ts/.tsx files)
   -  Return structured data: `{ files: [{ path, content, fileType }], metadata }`
   -  Error handling for non-existent vals, private vals, etc.

#### 3. TypeScript Parser Module (`tsParser`)

-  **Type**: Script val (library)
-  **Purpose**: Parse TypeScript and extract documentation-relevant information
-  **Dependencies**: `npm:typescript`
-  **Responsibilities**:
   -  Create TypeScript AST from source code
   -  Walk AST to find exported declarations
   -  Extract JSDoc comments with type information
   -  Transform into clean data structure
-  **Output Structure**:

```typescript
interface ParsedDocumentation {
   exports: {
      functions: FunctionDoc[];
      classes: ClassDoc[];
      interfaces: InterfaceDoc[];
      types: TypeAliasDoc[];
      constants: ConstantDoc[];
   };
   imports: ImportInfo[];
}

interface FunctionDoc {
   name: string;
   description: string;
   params: ParamDoc[];
   returns: ReturnDoc;
   examples: string[];
   tags: Record<string, string>; // @deprecated, @see, etc.
   signature: string;
   sourceLocation: { line: number; file: string };
}
```

#### 4. Documentation Renderer (`docRenderer`)

-  **Type**: Script val (library) or React component
-  **Purpose**: Transform parsed data into beautiful HTML
-  **Approach**: React component with Tailwind CSS
-  **Features**:
   -  Syntax highlighting for code examples
   -  Collapsible sections
   -  Search/filter functionality
   -  Responsive design
   -  Dark mode support
   -  Copy-to-clipboard for code snippets

#### 5. Cache Layer (`docCache`)

-  **Type**: Script val using Val Town blob storage or SQLite
-  **Purpose**: Cache generated documentation to improve performance
-  **Strategy**:
   -  Key: `${valIdentifier}-${valVersion}`
   -  TTL: 1 hour (or invalidate on val update)
   -  Store: Rendered HTML or parsed JSON

## Technical Implementation Details

### TypeScript AST Parsing

Key TypeScript compiler API functions to use:

```typescript
import ts from "npm:typescript";

// Parse source code
const sourceFile = ts.createSourceFile(
   filename,
   sourceCode,
   ts.ScriptTarget.Latest,
   true
);

// Walk the AST
function visit(node: ts.Node) {
   if (ts.isExportDeclaration(node)) {
      // Handle export declarations
   }
   if (ts.isFunctionDeclaration(node) && hasExportModifier(node)) {
      // Extract function documentation
   }
   ts.forEachChild(node, visit);
}

// Extract JSDoc
function getJsDocTags(node: ts.Node) {
   const jsDocTags = ts.getJSDocTags(node);
   // Process tags
}
```

### JSDoc Comment Extraction

Support standard JSDoc tags:

-  `@param` - Parameter descriptions
-  `@returns` / `@return` - Return value description
-  `@example` - Usage examples
-  `@deprecated` - Deprecation notices
-  `@see` - Related references
-  `@throws` / `@exception` - Error conditions
-  `@remarks` - Additional notes

### Val Town API Integration

Endpoints to use:

-  `GET /v1/vals/:id` - Get val metadata
-  `GET /v1/vals/:id/versions/:version` - Get specific version
-  Use the MCP tools available: `val-town:read_file`, `val-town:get_val_detail`

### Rendering Strategy

**Option A: Server-Side Rendering (Simpler)**

-  Generate complete HTML on each request
-  Pro: Works without JavaScript
-  Con: Slower, less interactive

**Option B: React SPA (Recommended)**

-  Serve a React app that fetches JSON documentation data
-  Use Tailwind for styling
-  Pro: Better UX, more interactive features
-  Con: Requires JavaScript enabled

**Recommended: Option B** for better user experience

### React Component Structure

```typescript
// Main component
export default function DocViewer({ valIdentifier }: Props) {
   const [docs, setDocs] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetch(`/api/docs?val=${valIdentifier}`)
         .then((res) => res.json())
         .then(setDocs);
   }, [valIdentifier]);

   return (
      <div className="docs-container">
         <Header val={docs?.metadata} />
         <SearchBar />
         <Sidebar exports={docs?.exports} />
         <MainContent exports={docs?.exports} />
      </div>
   );
}
```

Key sub-components:

-  `<Header>` - Val name, description, links
-  `<SearchBar>` - Filter exports by name
-  `<Sidebar>` - Navigation tree of exports
-  `<FunctionDoc>` - Render function documentation
-  `<TypeDoc>` - Render type/interface documentation
-  `<CodeBlock>` - Syntax-highlighted code

## Data Flow

### Request Flow

1. User visits: `https://username.val.town/v/docGenerator?val=someuser/someval`
2. Check cache for `someuser/someval-v{version}`
3. If cached: Return cached result
4. If not cached:
   -  Fetch val source via Val Town API
   -  Parse TypeScript AST
   -  Extract documentation data
   -  Transform to JSON structure
   -  Store in cache
   -  Render UI (serve React app + JSON data)
5. Return response

### Error Handling

-  **Val not found**: Show friendly 404 with search suggestions
-  **Private val**: Explain permissions needed
-  **Parse error**: Show what failed, offer to view raw source
-  **API rate limits**: Implement exponential backoff, show status

## UI/UX Design

### Layout

```
+------------------------------------------+
|  Header: Val Name, Description, Links   |
+------------------------------------------+
|           |                              |
|  Sidebar  |    Main Content Area         |
|  (Nav)    |                              |
|           |  Function: doSomething()     |
|  - Funcs  |  Description: ...            |
|  - Types  |  Parameters:                 |
|  - Consts |    - param1: string          |
|           |  Returns: Promise<void>      |
|           |  Example: [code block]       |
|           |                              |
+------------------------------------------+
```

### Visual Design Principles

-  Clean, minimal aesthetic (think Stripe/Vercel docs)
-  Ample whitespace
-  Syntax highlighting for code
-  Clear typography hierarchy
-  Responsive (mobile-friendly)
-  Accessibility: semantic HTML, ARIA labels, keyboard nav

### Color Scheme

-  Light mode: White background, dark text, accent color
-  Dark mode: Dark background, light text, softer accent
-  Syntax highlighting: Use Prism.js or Shiki themes

## Performance Optimization

### Caching Strategy

-  **Level 1**: In-memory cache (fastest, volatile)
-  **Level 2**: Val Town blob storage (persistent, slower)
-  **Level 3**: CDN layer (for popular vals)

### Cache Invalidation

-  Invalidate when val version changes
-  Option for manual cache clear via query param (`?refresh=true`)
-  Set reasonable TTL (1 hour default)

### Optimization Techniques

-  Lazy-load heavy dependencies (syntax highlighter)
-  Code splitting for React components
-  Compress responses (gzip)
-  Minify HTML/CSS/JS
-  Use HTTP/2 server push for critical resources

## Testing Strategy

### Unit Tests

-  Test AST parser with various TypeScript patterns
-  Test JSDoc extraction with edge cases
-  Test data transformation logic

### Integration Tests

-  Test against real vals with known documentation
-  Test error conditions (404s, malformed TypeScript)
-  Test caching behavior

### Manual Testing Checklist

-  [ ] Simple function with JSDoc
-  [ ] Class with methods
-  [ ] Interface definitions
-  [ ] Type aliases
-  [ ] Exported constants
-  [ ] Multiple exports in one file
-  [ ] Multi-file val
-  [ ] Val with npm dependencies
-  [ ] Val with no JSDoc comments
-  [ ] Val with malformed TypeScript

## Implementation Phases

### Phase 1: Core Parsing (Week 1)

-  [ ] Set up val structure
-  [ ] Implement Val Town API fetcher
-  [ ] Build basic TypeScript AST parser
-  [ ] Extract function declarations with JSDoc
-  [ ] Output JSON structure
-  [ ] Test with simple vals

### Phase 2: Enhanced Parsing (Week 1-2)

-  [ ] Add support for classes
-  [ ] Add support for interfaces
-  [ ] Add support for type aliases
-  [ ] Add support for constants
-  [ ] Handle complex JSDoc tags
-  [ ] Extract code examples from JSDoc

### Phase 3: Basic UI (Week 2)

-  [ ] Create React component structure
-  [ ] Implement basic layout (header, sidebar, content)
-  [ ] Render function documentation
-  [ ] Add syntax highlighting
-  [ ] Make responsive

### Phase 4: Polish (Week 3)

-  [ ] Add search/filter functionality
-  [ ] Implement dark mode
-  [ ] Add copy-to-clipboard
-  [ ] Improve typography and spacing
-  [ ] Add loading states and error handling
-  [ ] Implement caching

### Phase 5: Val Town Integration (Week 3-4)

-  [ ] Add Val Town-specific metadata display
-  [ ] Link to source code on val.town
-  [ ] Show val type (http, cron, etc.)
-  [ ] Display npm dependencies
-  [ ] Add "Fork this val" button
-  [ ] Show usage stats (if available via API)

### Phase 6: Launch (Week 4)

-  [ ] Write comprehensive README
-  [ ] Create demo video/screenshots
-  [ ] Test with various public vals
-  [ ] Publish to Val Town
-  [ ] Share on Val Town community
-  [ ] Gather feedback

## Future Enhancements (Post-v1)

### v2 Features

-  Multi-val documentation (entire projects)
-  Custom theming (allow users to customize colors/fonts)
-  Export to PDF/markdown
-  Permalink support for specific functions
-  "Edit on Val Town" live preview
-  AI-generated summaries for undocumented code

### v3 Features

-  Private val documentation (OAuth)
-  Team/organization documentation hubs
-  Version comparison (show API changes between versions)
-  Dependency tree visualization
-  Interactive API playground (test endpoints)
-  Usage analytics (which docs are most viewed)

## Technical Considerations

### TypeScript Parsing Edge Cases

-  Dynamic imports
-  Re-exports (`export * from`)
-  Namespace exports
-  Conditional types
-  Template literal types
-  Decorators (if supported)

### Val Town-Specific Considerations

-  Handle Deno-style imports (`npm:`, `jsr:`, ESM URLs)
-  Support Val Town standard library references
-  Handle val-to-val imports (`@username.valname`)
-  Respect Val Town privacy settings

### Security Considerations

-  Sanitize all user input (val identifiers)
-  Escape HTML in rendered docs
-  Rate limit documentation requests
-  Don't execute user code during parsing
-  Validate TypeScript before parsing (protect against malicious AST)

## Success Metrics

### Usage Metrics

-  Number of unique vals documented
-  Number of unique users
-  Repeat usage rate
-  Cache hit rate

### Quality Metrics

-  Parse success rate (% of vals that parse without errors)
-  User feedback (thumbs up/down)
-  Time to generate docs (performance)

### Community Metrics

-  Forks of the doc generator val
-  Mentions in Val Town community
-  Integration into other tools

## Resources & References

### Documentation

-  [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
-  [TSDoc Standard](https://tsdoc.org/)
-  [Val Town API Docs](https://docs.val.town/api/overview)
-  [Deno TypeScript Docs](https://docs.deno.com/runtime/manual/advanced/typescript/)

### Inspiration

-  [TypeDoc](https://typedoc.org/) - Industry standard
-  [API Extractor](https://api-extractor.com/) - Microsoft's approach
-  [Scalar API Reference](https://github.com/scalar/scalar) - Modern API docs UI
-  [Stripe API Docs](https://stripe.com/docs/api) - Best-in-class design

### Similar Tools

-  [TypeDoc](https://typedoc.org/)
-  [TSDoc](https://tsdoc.org/)
-  [documentation.js](https://github.com/documentationjs/documentation)
-  [API Extractor](https://api-extractor.com/)

## Open Questions

1. **Versioning**: Should we support generating docs for specific val versions, or always use latest?
2. **Private vals**: Is OAuth integration worth the complexity for v1?
3. **Multi-file vals**: Should v1 support project-style vals with multiple files, or just single-file vals?
4. **Embedding**: Should we provide an iframe-embeddable version for use in other sites?
5. **API vs UI**: Should we expose a JSON API endpoint separate from the UI?
6. **Custom domains**: If a user has a custom domain for their val, should docs respect that?

## Decision Log

### Why custom parser instead of TypeDoc?

-  More control over output format
-  Easier to add Val Town-specific features
-  Lighter weight for serverless deployment
-  Can iterate faster on UI/UX

### Why React instead of server-rendered HTML?

-  Better interactivity (search, filter, collapse)
-  Cleaner separation of data and presentation
-  Easier to add features like dark mode toggle
-  Modern user experience

### Why blob storage for cache instead of KV store?

-  Larger storage limits
-  Can store rendered HTML or large JSON structures
-  Built-in Val Town support

## Contact & Feedback

This project is open for feedback and contributions. Key areas where input would be valuable:

-  UI/UX design preferences
-  Additional JSDoc tags to support
-  Val Town-specific features to highlight
-  Performance optimization suggestions

---

## Getting Started

To begin implementation:

1. Create a new val called `docGenerator`
2. Start with Phase 1: Core Parsing
3. Test with a simple example val
4. Iterate based on results
5. Move to Phase 2 once core parsing works

Good luck! 🚀

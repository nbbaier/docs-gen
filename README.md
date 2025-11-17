# Val Town Documentation Generator

Automatically generate beautiful, interactive documentation for your Val Town vals by parsing TypeScript AST and extracting functions, classes, interfaces, types, and constants with their JSDoc comments.

## Features

- 📝 **Automatic Code Parsing** - Extracts functions, classes, interfaces, type aliases, and constants
- 💬 **JSDoc Support** - Parses `@param`, `@returns`, `@example`, and `@deprecated` tags
- 🔍 **Search & Filter** - Quickly find what you're looking for
- ⚡ **Fast Caching** - Sub-second responses for cached documentation (1-hour TTL)
- 🎨 **Clean UI** - Responsive design with Tailwind CSS via Twind
- 🚀 **Serverless** - Runs on Val Town's serverless platform

## Usage

### API Endpoint

Generate documentation JSON for any public val:

```
GET /api/docs?val=username/valname
```

**Query Parameters:**
- `val` (required) - Val identifier in format `username/valname`
- `refresh` (optional) - Set to `true` to bypass cache

**Example:**
```bash
curl "https://your-val.val.town/api/docs?val=stevekrouse/example"
```

**Response:**
```json
{
  "val": "stevekrouse/example",
  "version": "1",
  "generatedAt": "2025-11-17T12:00:00.000Z",
  "exports": {
    "functions": [...],
    "classes": [...],
    "interfaces": [...],
    "types": [...],
    "constants": [...]
  },
  "imports": [...],
  "metadata": {...}
}
```

### Web UI

Visit the root URL with a val query parameter to view interactive documentation:

```
https://your-val.val.town/?val=username/valname
```

The UI provides:
- Searchable sidebar navigation
- Syntax-highlighted code examples
- Detailed parameter and return type information
- JSDoc comment rendering
- Direct links to source code locations

## Project Structure

```
.
├── backend/
│   ├── docGenerator.http.ts    # Main HTTP entry point
│   ├── routes/
│   │   ├── apiDocs.ts          # API route handler
│   │   └── ui.ts               # UI route handler
│   └── services/
│       ├── docCache.ts         # Blob-backed cache with memory front
│       ├── docService.ts       # Main orchestration service
│       ├── tsParser.ts         # TypeScript AST parser
│       └── valFetcher.ts       # Val Town API client
├── frontend/
│   ├── index.html              # HTML entry point
│   ├── index.tsx               # React app entry
│   └── components/             # React UI components
│       ├── App.tsx
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── MainContent.tsx
│       ├── FunctionDocCard.tsx
│       ├── ClassDocCard.tsx
│       ├── InterfaceDocCard.tsx
│       ├── TypeDocCard.tsx
│       ├── ConstantDocCard.tsx
│       ├── CodeBlock.tsx
│       └── DocCommentDisplay.tsx
└── shared/
    └── docTypes.ts             # Shared TypeScript types
```

## Architecture

### 1. Request Flow

1. **Request** → Hono HTTP val receives request
2. **Cache Check** → Check memory cache, then blob storage
3. **On Cache Miss:**
   - Fetch val metadata from Val Town API
   - Fetch source code from esm.town
   - Parse TypeScript AST to extract documentation
   - Cache result in blob storage and memory
4. **Response** → Return JSON (API) or rendered HTML (UI)

### 2. Caching Strategy

- **Memory Cache**: LRU cache (100 entries) for hot paths
- **Blob Storage**: Persistent cache with 1-hour TTL
- **Cache Key**: Derived from `username/valname@version`
- **Cache Hit Performance**: ~20ms
- **Cache Miss**: ~2-3 seconds (includes API calls and parsing)

### 3. TypeScript Parsing

Uses the TypeScript Compiler API to:
- Create an in-memory compiler host
- Parse source files into AST
- Walk nodes to extract declarations
- Parse JSDoc comments using `ts.getJSDocTags()`
- Generate type signatures and metadata

## API Documentation

### Types

See `shared/docTypes.ts` for complete type definitions:

- `DocManifest` - Main documentation manifest
- `FunctionDoc` - Function documentation
- `ClassDoc` - Class documentation
- `InterfaceDoc` - Interface documentation
- `TypeAliasDoc` - Type alias documentation
- `ConstantDoc` - Constant/variable documentation
- `DocComment` - Parsed JSDoc comment
- `ValMetadata` - Val Town metadata

### Services

#### `docService.ts`

Main orchestration service:

```typescript
// Generate docs with caching
await generateDocs(val: string, opts?: { refresh?: boolean })

// Refresh cache
await refreshDocs(val: string)

// Get cached docs only
await getCachedDocs(val: string)

// Clear cache
await clearValCache(val: string)
await clearAllCaches()
```

#### `valFetcher.ts`

Val Town API client:

```typescript
// Fetch val bundle
await valFetcher.fetchLatest(val: string): Promise<ValBundle>
```

#### `tsParser.ts`

TypeScript AST parser:

```typescript
// Parse val bundle to documentation
parseValBundle(bundle: ValBundle): DocManifest
```

#### `docCache.ts`

Documentation cache:

```typescript
// Create cache instance
const cache = createDocCache({ ttlMs: 3600000, blobPrefix: "doc-cache" })

// Cache operations
await cache.get<T>(key: string)
await cache.set<T>(key: string, data: T, metadata: { version: string })
await cache.has(key: string)
await cache.delete(key: string)
```

## Development

### Testing Locally

1. Clone this repository
2. Deploy to Val Town as an HTTP val
3. Test with a public val:
   ```
   https://your-val.val.town/?val=stevekrouse/example
   ```

### Deployment

This project is designed to run as a Val Town HTTP val. The entry point is `backend/docGenerator.http.ts`.

To deploy:
1. Create a new HTTP val in Val Town
2. Copy the entire project structure
3. Point to `backend/docGenerator.http.ts` as the entry point

## Performance

- **First Request** (cache miss): 2-3 seconds
- **Cached Request**: 20-50ms
- **Cache TTL**: 1 hour
- **API Calls per Request**: Max 2 (metadata + source)

## Limitations

- **Public vals only** - No authentication for private vals
- **Single file vals** - Multi-file projects not yet supported
- **Basic syntax highlighting** - No Prism.js integration yet
- **No version history** - Only latest version supported
- **Rate limiting** - Not yet implemented (planned)

## Future Enhancements

- [ ] Rate limiting to prevent abuse
- [ ] Support for private vals with authentication
- [ ] Multi-file val/project support
- [ ] Version history and diffing
- [ ] Enhanced syntax highlighting with Prism.js
- [ ] Export to Markdown
- [ ] Custom theming
- [ ] Metrics and analytics dashboard

## Contributing

This is a Val Town project. To contribute:
1. Fork the val
2. Make your changes
3. Test thoroughly
4. Submit a pull request with clear description

## License

MIT License - see LICENSE file for details

## Credits

Built with:
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Hono](https://hono.dev/) - Web framework
- [React](https://react.dev/) - UI library
- [Twind](https://twind.style/) - Tailwind CSS-in-JS
- [Val Town](https://val.town/) - Serverless platform

---

**Need help?** Open an issue or reach out on Val Town Discord.

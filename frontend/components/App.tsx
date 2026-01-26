/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type React from "https://esm.sh/react@18.2.0";
import { useState } from "https://esm.sh/react@18.2.0";
import type { DocManifest } from "../../shared/docTypes.ts";
import { ErrorMessage } from "./ErrorMessage.tsx";
import { Header } from "./Header.tsx";
import { LoadingSpinner } from "./LoadingSpinner.tsx";
import { MainContent } from "./MainContent.tsx";
import { Sidebar } from "./Sidebar.tsx";

/**
 * Props for the main App component.
 */
export interface AppProps {
  /** Initial documentation manifest (from SSR) */
  initialManifest?: DocManifest;
  /** Initial val identifier */
  initialVal?: string;
  /** Initial error message */
  error?: string;
}

/**
 * Main application component for the Val Town documentation generator.
 *
 * Manages state for documentation manifest, loading states, errors, and search.
 * Handles fetching documentation from the API and rendering the UI.
 *
 * @param props - Component props
 * @returns React element
 */
export function App(props: AppProps): React.ReactElement {
  const [manifest, setManifest] = useState<DocManifest | null>(
    props.initialManifest || null,
  );
  const [val, setVal] = useState(props.initialVal || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(props.error || null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch documentation for a val
  const fetchDocs = async (valIdentifier: string, refresh = false) => {
    if (!valIdentifier) return;

    console.log(
      `[fetchDocs] Requesting docs for val: ${valIdentifier}, refresh: ${refresh}`,
    );
    setLoading(true);
    setError(null);

    try {
      const url = `/api/docs?val=${encodeURIComponent(valIdentifier)}${
        refresh ? "&refresh=true" : ""
      }`;
      console.log(`[fetchDocs] Fetching from URL: ${url}`);

      const response = await fetch(url);
      console.log(
        `[fetchDocs] Response status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[fetchDocs] Error response:`, errorData);
        throw new Error(errorData.message || "Failed to fetch documentation");
      }

      const data = await response.json();
      console.log(`[fetchDocs] Successfully fetched docs:`, data);
      setManifest(data);
      setVal(valIdentifier);

      // Update URL without reload
      const newUrl = `/?val=${encodeURIComponent(valIdentifier)}`;
      globalThis.history.pushState({}, "", newUrl);
    } catch (err) {
      console.error(`[fetchDocs] Error caught:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setManifest(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle val input submission
  const handleSubmit = (valIdentifier: string) => {
    fetchDocs(valIdentifier, false);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (val) {
      fetchDocs(val, true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSubmit={handleSubmit}
        onRefresh={handleRefresh}
        currentVal={val}
        onSearchChange={setSearchQuery}
      />

      {error && (
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage message={error} />
        </div>
      )}

      {loading && (
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      )}

      {!loading && !error && manifest && (
        <div className="flex">
          <Sidebar manifest={manifest} searchQuery={searchQuery} />
          <MainContent manifest={manifest} searchQuery={searchQuery} />
        </div>
      )}

      {!loading && !error && !manifest && (
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Val Town Documentation Generator
          </h2>
          <p className="text-gray-600 mb-8">
            Enter a val identifier (e.g., "username/valname") above to generate
            documentation
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto text-left">
            <h3 className="text-xl font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">📝</span>
                <span>
                  Automatic extraction of functions, classes, interfaces, types,
                  and constants
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💬</span>
                <span>
                  JSDoc comment parsing with @param, @returns, and @example tags
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔍</span>
                <span>Search and filter functionality</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⚡</span>
                <span>Fast caching for quick subsequent loads</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎨</span>
                <span>Clean, responsive UI with syntax highlighting</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

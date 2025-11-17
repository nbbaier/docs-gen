/** @jsxImportSource https://esm.sh/react@18.2.0 */

import { useState, useEffect } from "https://esm.sh/react@18.2.0";
import type { DocManifest } from "../../shared/docTypes.ts";
import { Header } from "./Header.tsx";
import { Sidebar } from "./Sidebar.tsx";
import { MainContent } from "./MainContent.tsx";
import { ErrorMessage } from "./ErrorMessage.tsx";
import { LoadingSpinner } from "./LoadingSpinner.tsx";

export interface AppProps {
  initialManifest?: DocManifest;
  initialVal?: string;
  error?: string;
}

export function App(props: AppProps) {
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

    setLoading(true);
    setError(null);

    try {
      const url = `/api/docs?val=${encodeURIComponent(valIdentifier)}${
        refresh ? "&refresh=true" : ""
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch documentation");
      }

      const data = await response.json();
      setManifest(data);
      setVal(valIdentifier);

      // Update URL without reload
      const newUrl = `/?val=${encodeURIComponent(valIdentifier)}`;
      window.history.pushState({}, "", newUrl);
    } catch (err) {
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
                <span>Automatic extraction of functions, classes, interfaces, types, and constants</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💬</span>
                <span>JSDoc comment parsing with @param, @returns, and @example tags</span>
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

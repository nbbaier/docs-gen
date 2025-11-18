/** @jsxImportSource https://esm.sh/react@18.2.0 */

import React from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import { App } from "./components/App.tsx";

/**
 * Frontend entry point for the Val Town documentation generator.
 *
 * Retrieves initial data injected by the server and renders the App component.
 */

// Get initial data injected by server
const initialData = (window as any).__INITIAL_DATA__ || {};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App
      initialManifest={initialData.manifest}
      initialVal={initialData.val}
      error={initialData.error}
    />
  </React.StrictMode>,
);

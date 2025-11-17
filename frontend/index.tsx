/** @jsxImportSource https://esm.sh/react@18.2.0 */

import React from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import { App } from "./components/App.tsx";

// Get initial data injected by server
const initialData = (window as any).__INITIAL_DATA__ || {};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App
      initialManifest={initialData.manifest}
      initialVal={initialData.val}
      error={initialData.error}
    />
  </React.StrictMode>
);

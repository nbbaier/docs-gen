/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { DocManifest } from "../../shared/docTypes.ts";

/**
 * Props for the Sidebar component.
 */
export interface SidebarProps {
  /** Documentation manifest to display */
  manifest: DocManifest;
  /** Current search query for filtering */
  searchQuery: string;
}

/**
 * Sidebar component displaying navigation for all exports in the manifest.
 *
 * Shows val info, and filtered lists of functions, classes, interfaces, types, and constants.
 * Provides click handlers to scroll to each item in the main content.
 *
 * @param props - Component props
 * @returns React element
 */
export function Sidebar(props: SidebarProps) {
  const { manifest, searchQuery } = props;
  const query = searchQuery.toLowerCase();

  const filterBySearch = (name: string) => {
    if (!query) return true;
    return name.toLowerCase().includes(query);
  };

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Val Info
          </h2>
          <p className="text-sm text-gray-700 font-medium">{manifest.val}</p>
          <p className="text-xs text-gray-500">v{manifest.version}</p>
        </div>

        {manifest.exports.functions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Functions (
              {
                manifest.exports.functions.filter((f) => filterBySearch(f.name))
                  .length
              }
              )
            </h3>
            <ul className="space-y-1">
              {manifest.exports.functions
                .filter((f) => filterBySearch(f.name))
                .map((func) => (
                  <li key={func.name}>
                    <button
                      type="button"
                      onClick={() => scrollToElement(`func-${func.name}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                    >
                      {func.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {manifest.exports.classes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Classes (
              {
                manifest.exports.classes.filter((c) => filterBySearch(c.name))
                  .length
              }
              )
            </h3>
            <ul className="space-y-1">
              {manifest.exports.classes
                .filter((c) => filterBySearch(c.name))
                .map((cls) => (
                  <li key={cls.name}>
                    <button
                      type="button"
                      onClick={() => scrollToElement(`class-${cls.name}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                    >
                      {cls.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {manifest.exports.interfaces.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Interfaces (
              {
                manifest.exports.interfaces.filter((i) =>
                  filterBySearch(i.name),
                ).length
              }
              )
            </h3>
            <ul className="space-y-1">
              {manifest.exports.interfaces
                .filter((i) => filterBySearch(i.name))
                .map((iface) => (
                  <li key={iface.name}>
                    <button
                      type="button"
                      onClick={() => scrollToElement(`interface-${iface.name}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                    >
                      {iface.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {manifest.exports.types.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Types (
              {
                manifest.exports.types.filter((t) => filterBySearch(t.name))
                  .length
              }
              )
            </h3>
            <ul className="space-y-1">
              {manifest.exports.types
                .filter((t) => filterBySearch(t.name))
                .map((type) => (
                  <li key={type.name}>
                    <button
                      type="button"
                      onClick={() => scrollToElement(`type-${type.name}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                    >
                      {type.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {manifest.exports.constants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Constants (
              {
                manifest.exports.constants.filter((c) => filterBySearch(c.name))
                  .length
              }
              )
            </h3>
            <ul className="space-y-1">
              {manifest.exports.constants
                .filter((c) => filterBySearch(c.name))
                .map((constant) => (
                  <li key={constant.name}>
                    <button
                      type="button"
                      onClick={() => scrollToElement(`const-${constant.name}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                    >
                      {constant.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

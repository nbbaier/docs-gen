/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { DocManifest } from "../../shared/docTypes.ts";
import { ClassDocCard } from "./ClassDocCard.tsx";
import { ConstantDocCard } from "./ConstantDocCard.tsx";
import { FunctionDocCard } from "./FunctionDocCard.tsx";
import { InterfaceDocCard } from "./InterfaceDocCard.tsx";
import { TypeDocCard } from "./TypeDocCard.tsx";

/**
 * Props for the MainContent component.
 */
export interface MainContentProps {
  /** Documentation manifest to display */
  manifest: DocManifest;
  /** Current search query for filtering */
  searchQuery: string;
}

/**
 * Main content area displaying filtered documentation cards.
 *
 * Renders sections for functions, classes, interfaces, types, and constants,
 * filtered by the search query. Shows "no results" message when search yields no matches.
 *
 * @param props - Component props
 * @returns React element
 */
export function MainContent(props: MainContentProps) {
  const { manifest, searchQuery } = props;
  const query = searchQuery.toLowerCase();

  const filterBySearch = (name: string) => {
    if (!query) return true;
    return name.toLowerCase().includes(query);
  };

  const filteredFunctions = manifest.exports.functions.filter((f) =>
    filterBySearch(f.name),
  );
  const filteredClasses = manifest.exports.classes.filter((c) =>
    filterBySearch(c.name),
  );
  const filteredInterfaces = manifest.exports.interfaces.filter((i) =>
    filterBySearch(i.name),
  );
  const filteredTypes = manifest.exports.types.filter((t) =>
    filterBySearch(t.name),
  );
  const filteredConstants = manifest.exports.constants.filter((c) =>
    filterBySearch(c.name),
  );

  const hasResults =
    filteredFunctions.length > 0 ||
    filteredClasses.length > 0 ||
    filteredInterfaces.length > 0 ||
    filteredTypes.length > 0 ||
    filteredConstants.length > 0;

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-8 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {manifest.metadata.name}
          </h1>
          <p className="text-gray-600">
            by {manifest.metadata.author.username} • v{manifest.version}
          </p>
          {manifest.metadata.readme && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {manifest.metadata.readme}
              </p>
            </div>
          )}
        </div>

        {!hasResults && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No results found for "{searchQuery}"
            </p>
          </div>
        )}

        {filteredFunctions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Functions</h2>
            <div className="space-y-6">
              {filteredFunctions.map((func) => (
                <FunctionDocCard key={func.name} func={func} />
              ))}
            </div>
          </section>
        )}

        {filteredClasses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Classes</h2>
            <div className="space-y-6">
              {filteredClasses.map((cls) => (
                <ClassDocCard key={cls.name} cls={cls} />
              ))}
            </div>
          </section>
        )}

        {filteredInterfaces.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Interfaces
            </h2>
            <div className="space-y-6">
              {filteredInterfaces.map((iface) => (
                <InterfaceDocCard key={iface.name} iface={iface} />
              ))}
            </div>
          </section>
        )}

        {filteredTypes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Type Aliases
            </h2>
            <div className="space-y-6">
              {filteredTypes.map((type) => (
                <TypeDocCard key={type.name} type={type} />
              ))}
            </div>
          </section>
        )}

        {filteredConstants.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Constants</h2>
            <div className="space-y-6">
              {filteredConstants.map((constant) => (
                <ConstantDocCard key={constant.name} constant={constant} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

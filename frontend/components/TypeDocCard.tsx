/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { TypeAliasDoc } from "../../shared/docTypes.ts";
import { CodeBlock } from "./CodeBlock.tsx";
import { DocCommentDisplay } from "./DocCommentDisplay.tsx";

export interface TypeDocCardProps {
  type: TypeAliasDoc;
}

export function TypeDocCard(props: TypeDocCardProps) {
  const { type } = props;

  return (
    <div id={`type-${type.name}`} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            type {type.name}
          </h3>
          <span className="text-xs text-gray-500">
            {type.location.file}:{type.location.line}
          </span>
        </div>
        {type.isExported && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
            exported
          </span>
        )}
      </div>

      {type.comment && <DocCommentDisplay comment={type.comment} />}

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Definition</h4>
        <CodeBlock code={`type ${type.name} = ${type.type}`} language="typescript" />
      </div>
    </div>
  );
}

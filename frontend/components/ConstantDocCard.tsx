/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { ConstantDoc } from "../../shared/docTypes.ts";
import { CodeBlock } from "./CodeBlock.tsx";
import { DocCommentDisplay } from "./DocCommentDisplay.tsx";

export interface ConstantDocCardProps {
  constant: ConstantDoc;
}

export function ConstantDocCard(props: ConstantDocCardProps) {
  const { constant } = props;

  return (
    <div id={`const-${constant.name}`} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {constant.name}
          </h3>
          <span className="text-xs text-gray-500">
            {constant.location.file}:{constant.location.line}
          </span>
        </div>
        {constant.isExported && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
            exported
          </span>
        )}
      </div>

      {constant.comment && <DocCommentDisplay comment={constant.comment} />}

      <div className="mt-4">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm font-semibold text-gray-700">Type: </span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{constant.type}</code>
          </div>
        </div>
      </div>

      {constant.value && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Value</h4>
          <CodeBlock code={constant.value} language="typescript" />
        </div>
      )}
    </div>
  );
}

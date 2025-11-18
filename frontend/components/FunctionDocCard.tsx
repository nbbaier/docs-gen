/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { FunctionDoc } from "../../shared/docTypes.ts";
import { CodeBlock } from "./CodeBlock.tsx";
import { DocCommentDisplay } from "./DocCommentDisplay.tsx";

/**
 * Props for the FunctionDocCard component.
 */
export interface FunctionDocCardProps {
  /** Function documentation to display */
  func: FunctionDoc;
}

/**
 * Component for displaying function documentation.
 *
 * Shows function name, signature, parameters, return type, and JSDoc comments.
 *
 * @param props - Component props
 * @returns React element
 */
export function FunctionDocCard(props: FunctionDocCardProps) {
  const { func } = props;

  return (
    <div id={`func-${func.name}`} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {func.isAsync && <span className="text-purple-600">async </span>}
            {func.name}
          </h3>
          <span className="text-xs text-gray-500">
            {func.location.file}:{func.location.line}
          </span>
        </div>
        {func.isExported && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
            exported
          </span>
        )}
      </div>

      {func.comment && <DocCommentDisplay comment={func.comment} />}

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Signature</h4>
        <CodeBlock code={func.signature} language="typescript" />
      </div>

      {func.parameters.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Parameters
          </h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Optional</th>
                <th className="text-left py-2 px-2">Default</th>
              </tr>
            </thead>
            <tbody>
              {func.parameters.map((param) => (
                <tr key={param.name} className="border-b">
                  <td className="py-2 px-2 font-mono text-blue-600">
                    {param.name}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs">{param.type}</td>
                  <td className="py-2 px-2">{param.optional ? "Yes" : "No"}</td>
                  <td className="py-2 px-2 font-mono text-xs">
                    {param.defaultValue || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Returns</h4>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          {func.returnType}
        </code>
      </div>
    </div>
  );
}

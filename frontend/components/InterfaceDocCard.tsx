/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { InterfaceDoc } from "../../shared/docTypes.ts";
import { DocCommentDisplay } from "./DocCommentDisplay.tsx";

/**
 * Props for the InterfaceDocCard component.
 */
export interface InterfaceDocCardProps {
  /** Interface documentation to display */
  iface: InterfaceDoc;
}

/**
 * Component for displaying interface documentation.
 *
 * Shows interface name, extends clauses, properties, methods, and JSDoc comments.
 *
 * @param props - Component props
 * @returns React element
 */
export function InterfaceDocCard(props: InterfaceDocCardProps) {
  const { iface } = props;

  return (
    <div
      id={`interface-${iface.name}`}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            interface {iface.name}
          </h3>
          <span className="text-xs text-gray-500">
            {iface.location.file}:{iface.location.line}
          </span>
          {iface.extends && iface.extends.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              extends{" "}
              {iface.extends.map((ext, i) => (
                <span key={ext}>
                  <code className="bg-gray-100 px-1 rounded">{ext}</code>
                  {i < iface.extends?.length - 1 && ", "}
                </span>
              ))}
            </p>
          )}
        </div>
        {iface.isExported && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
            exported
          </span>
        )}
      </div>

      {iface.comment && <DocCommentDisplay comment={iface.comment} />}

      {iface.properties.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Properties
          </h4>
          <div className="space-y-2">
            {iface.properties.map((prop) => (
              <div key={prop.name} className="bg-gray-50 p-3 rounded">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm text-blue-600">
                    {prop.isReadonly && (
                      <span className="text-purple-600">readonly </span>
                    )}
                    {prop.name}
                    {prop.isOptional && "?"}: {prop.type}
                  </span>
                </div>
                {prop.comment && (
                  <p className="text-sm text-gray-600 mt-1">
                    {prop.comment.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {iface.methods.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Methods</h4>
          <div className="space-y-3">
            {iface.methods.map((method) => (
              <div key={method.name} className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-sm text-blue-600 mb-1">
                  {method.name}(): {method.returnType}
                </div>
                {method.comment && (
                  <p className="text-sm text-gray-600 mt-1">
                    {method.comment.description}
                  </p>
                )}
                {method.parameters.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Parameters: </span>
                    {method.parameters.map((param, i) => (
                      <span key={param.name} className="text-xs font-mono">
                        {param.name}: {param.type}
                        {i < method.parameters.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

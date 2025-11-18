/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { ClassDoc } from "../../shared/docTypes.ts";
import { DocCommentDisplay } from "./DocCommentDisplay.tsx";

/**
 * Props for the ClassDocCard component.
 */
export interface ClassDocCardProps {
  /** Class documentation to display */
  cls: ClassDoc;
}

/**
 * Component for displaying class documentation.
 *
 * Shows class name, extends/implements clauses, constructor, properties, methods, and JSDoc comments.
 *
 * @param props - Component props
 * @returns React element
 */
export function ClassDocCard(props: ClassDocCardProps) {
  const { cls } = props;

  return (
    <div id={`class-${cls.name}`} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {cls.isAbstract && (
              <span className="text-purple-600">abstract </span>
            )}
            class {cls.name}
          </h3>
          <span className="text-xs text-gray-500">
            {cls.location.file}:{cls.location.line}
          </span>
          {cls.extends && (
            <p className="text-sm text-gray-600 mt-1">
              extends{" "}
              <code className="bg-gray-100 px-1 rounded">{cls.extends}</code>
            </p>
          )}
          {cls.implements && cls.implements.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              implements{" "}
              {cls.implements.map((impl, i) => (
                <span key={impl}>
                  <code className="bg-gray-100 px-1 rounded">{impl}</code>
                  {i < cls.implements?.length - 1 && ", "}
                </span>
              ))}
            </p>
          )}
        </div>
        {cls.isExported && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
            exported
          </span>
        )}
      </div>

      {cls.comment && <DocCommentDisplay comment={cls.comment} />}

      {cls.constructor && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Constructor
          </h4>
          <div className="bg-gray-50 p-3 rounded">
            {cls.constructor.parameters.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 px-2">Parameter</th>
                    <th className="text-left py-1 px-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.constructor.parameters.map((param) => (
                    <tr key={param.name}>
                      <td className="py-1 px-2 font-mono text-blue-600">
                        {param.name}
                      </td>
                      <td className="py-1 px-2 font-mono text-xs">
                        {param.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {cls.properties.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Properties
          </h4>
          <div className="space-y-2">
            {cls.properties.map((prop) => (
              <div key={prop.name} className="bg-gray-50 p-3 rounded">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm text-blue-600">
                    {prop.visibility !== "public" && (
                      <span className="text-gray-500">{prop.visibility} </span>
                    )}
                    {prop.isReadonly && (
                      <span className="text-purple-600">readonly </span>
                    )}
                    {prop.name}: {prop.type}
                  </span>
                  {prop.isOptional && (
                    <span className="text-xs text-gray-500">optional</span>
                  )}
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

      {cls.methods.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Methods</h4>
          <div className="space-y-3">
            {cls.methods.map((method) => (
              <div key={method.name} className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-sm text-blue-600 mb-1">
                  {method.visibility !== "public" && (
                    <span className="text-gray-500">{method.visibility} </span>
                  )}
                  {method.isStatic && (
                    <span className="text-purple-600">static </span>
                  )}
                  {method.isAsync && (
                    <span className="text-purple-600">async </span>
                  )}
                  {method.name}()
                </div>
                {method.comment && (
                  <p className="text-sm text-gray-600 mt-1">
                    {method.comment.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

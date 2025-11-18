/** @jsxImportSource https://esm.sh/react@18.2.0 */

import type { DocComment } from "../../shared/docTypes.ts";

/**
 * Props for the DocCommentDisplay component.
 */
export interface DocCommentDisplayProps {
  /** Documentation comment to display */
  comment: DocComment;
}

/**
 * Component for displaying parsed JSDoc comments.
 *
 * Renders description, @param tags, @returns tag, @example tags, and @deprecated warnings.
 *
 * @param props - Component props
 * @returns React element
 */
export function DocCommentDisplay(props: DocCommentDisplayProps) {
  const { comment } = props;

  return (
    <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 rounded">
      {comment.deprecated && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <span className="font-semibold text-yellow-800">⚠️ Deprecated: </span>
          <span className="text-yellow-700">{comment.deprecated}</span>
        </div>
      )}

      {comment.description && (
        <p className="text-gray-700 mb-2">{comment.description}</p>
      )}

      {comment.params && comment.params.length > 0 && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">
            Parameters
          </h5>
          <ul className="space-y-1">
            {comment.params.map((param) => (
              <li key={param.name} className="text-sm">
                <code className="bg-white px-1 py-0.5 rounded text-blue-600">
                  {param.name}
                </code>
                {param.type && (
                  <span className="text-gray-500 text-xs ml-1">
                    ({param.type})
                  </span>
                )}
                {param.description && (
                  <span className="text-gray-600 ml-2">
                    {param.description}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {comment.returns && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">
            Returns
          </h5>
          <p className="text-sm text-gray-600">
            {comment.returns.type && (
              <code className="bg-white px-1 py-0.5 rounded text-blue-600 mr-2">
                {comment.returns.type}
              </code>
            )}
            {comment.returns.description}
          </p>
        </div>
      )}

      {comment.examples && comment.examples.length > 0 && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold text-gray-600 uppercase mb-1">
            Examples
          </h5>
          {comment.examples.map((example, i) => (
            <pre
              key={i}
              className="text-sm bg-white p-2 rounded mt-1 overflow-x-auto"
            >
              <code>{example}</code>
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}

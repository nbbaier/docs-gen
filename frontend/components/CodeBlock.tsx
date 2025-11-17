/** @jsxImportSource https://esm.sh/react@18.2.0 */

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock(props: CodeBlockProps) {
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
      <code className="text-sm font-mono">{props.code}</code>
    </pre>
  );
}

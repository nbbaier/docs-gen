/** @jsxImportSource https://esm.sh/react@18.2.0 */

/**
 * Props for the CodeBlock component.
 */
export interface CodeBlockProps {
  /** Code content to display */
  code: string;
  /** Language identifier for syntax highlighting (currently unused) */
  language?: string;
}

/**
 * Component for displaying code blocks with syntax formatting.
 *
 * @param props - Component props
 * @returns React element
 */
export function CodeBlock(props: CodeBlockProps) {
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
      <code className="text-sm font-mono">{props.code}</code>
    </pre>
  );
}

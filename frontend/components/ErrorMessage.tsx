/** @jsxImportSource https://esm.sh/react@18.2.0 */

/**
 * Props for the ErrorMessage component.
 */
export interface ErrorMessageProps {
  /** Error message to display */
  message: string;
}

/**
 * Component for displaying error messages with styling.
 *
 * @param props - Component props
 * @returns React element
 */
export function ErrorMessage(props: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start">
        <span className="text-2xl mr-3">❌</span>
        <div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{props.message}</p>
        </div>
      </div>
    </div>
  );
}

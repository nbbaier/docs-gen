/** @jsxImportSource https://esm.sh/react@18.2.0 */

import { useState } from "https://esm.sh/react@18.2.0";

export interface HeaderProps {
  onSubmit: (val: string) => void;
  onRefresh: () => void;
  currentVal: string;
  onSearchChange: (query: string) => void;
}

export function Header(props: HeaderProps) {
  const [inputVal, setInputVal] = useState(props.currentVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      props.onSubmit(inputVal.trim());
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">
              📚 Val Town Docs
            </h1>
          </div>
          {props.currentVal && (
            <button
              onClick={props.onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="username/valname"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Generate Docs
              </button>
            </div>
          </form>

          {props.currentVal && (
            <input
              type="text"
              placeholder="🔍 Search..."
              onChange={(e) => props.onSearchChange(e.target.value)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
    </header>
  );
}

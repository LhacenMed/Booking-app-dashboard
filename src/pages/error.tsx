import React, { useState, useEffect } from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Helper function to get a user-friendly error message
const getErrorMessage = (error: unknown): string => {
  // Handle route errors
  if (isRouteErrorResponse(error)) {
    return error.data?.message || error.statusText;
  }

  // Handle TypeError (like the undefined property access)
  if (error instanceof TypeError) {
    return "There was a problem loading the data. Please try again.";
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback error message
  return "An unexpected error occurred. Please try again.";
};

// Helper to get error location
const getErrorLocation = (error: Error): string => {
  const stackLines = error.stack?.split("\n") || [];
  const locationLine = stackLines.find((line) => line.includes("/src/"));
  if (!locationLine) return "Unknown location";

  const match = locationLine.match(/\/src\/.*:\d+:\d+/);
  return match ? match[0] : "Unknown location";
};

// Helper to get component name
const getComponentName = (error: Error): string => {
  const stack = error.stack || "";
  const componentMatch = stack.match(/at ([A-Z][A-Za-z0-9]+)(\.|$)/);
  return componentMatch ? componentMatch[1] : "Unknown component";
};

const ErrorPage: React.FC = () => {
  const error = useRouteError() as Error;
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [stackCopied, setStackCopied] = useState(false);
  const [appState, setAppState] = useState<any>(null);
  const [timestamp] = useState(new Date().toISOString());

  // Collect app state on mount
  useEffect(() => {
    const state = {
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp,
      routeParams: location.pathname,
      queryParams: Object.fromEntries(new URLSearchParams(location.search)),
    };
    setAppState(state);
  }, [timestamp]);

  // Get the error message
  const errorMessage = getErrorMessage(error);

  // Handle copy functionality for full debug report
  const handleCopyDebugReport = async () => {
    try {
      const debugReport = {
        error: {
          message: errorMessage,
          stack: error.stack,
          componentName: getComponentName(error),
          location: getErrorLocation(error),
        },
        state: appState,
        timestamp,
      };

      await navigator.clipboard.writeText(JSON.stringify(debugReport, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy debug report:", err);
    }
  };

  // Handle copy stack trace
  const handleCopyStack = async () => {
    try {
      await navigator.clipboard.writeText(error.stack || "");
      setStackCopied(true);
      setTimeout(() => setStackCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy stack trace:", err);
    }
  };

  // Handle opening in VS Code (if supported)
  const handleOpenInEditor = () => {
    const location = getErrorLocation(error);
    if (location === "Unknown location") return;

    // This will work if the user has the VS Code extension installed
    window.open(`cursor://file/${location}`);
  };

  // Handle state reset
  const handleResetState = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black font-ot">
      <div className="w-full max-w-4xl p-8">
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
          {/* Error Icon */}
          <div className="mb-6 text-center">
            <svg
              className="mx-auto h-16 w-16 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-ot ot-semibold text-gray-100 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-400 font-ot ot-regular">{errorMessage}</p>
          </div>

          {/* Development Mode Details */}
          {import.meta.env.DEV && error instanceof Error && (
            <div className="space-y-6">
              {/* Quick Info Panel */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Component</p>
                    <p className="font-ot ot-medium text-gray-300">
                      {getComponentName(error)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Timestamp</p>
                    <p className="font-ot ot-medium text-gray-300">
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Environment</p>
                    <p className="font-ot ot-medium text-gray-300">
                      {import.meta.env.MODE}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Route</p>
                    <p className="font-ot ot-medium text-gray-300">
                      {location.pathname}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-4">
                <details className="text-left">
                  <summary className="text-sm font-ot ot-medium text-gray-300 cursor-pointer hover:text-gray-100">
                    Stack Trace
                  </summary>
                  <div className="relative mt-2">
                    <pre className="p-4 bg-gray-900/50 rounded-lg text-xs font-ot ot-regular text-gray-300 overflow-auto border border-gray-700 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {error.stack}
                    </pre>
                    <button
                      onClick={handleCopyStack}
                      className="absolute top-4 right-4 inline-flex items-center px-2 py-1 text-xs font-ot ot-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors border border-gray-600 shadow-sm"
                    >
                      {stackCopied ? "Copied!" : "Copy Stack"}
                    </button>
                  </div>
                </details>

                <details className="text-left">
                  <summary className="text-sm font-ot ot-medium text-gray-300 cursor-pointer hover:text-gray-100">
                    Application State
                  </summary>
                  <div className="mt-2">
                    <pre className="p-4 bg-gray-900/50 rounded-lg text-xs font-ot ot-regular text-gray-300 overflow-auto border border-gray-700 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {JSON.stringify(appState, null, 2)}
                    </pre>
                  </div>
                </details>

                {/* Error Location */}
                <div className="flex items-center space-x-2">
                  <code className="text-sm bg-gray-900/50 px-2 py-1 rounded border border-gray-700 text-gray-300">
                    {getErrorLocation(error)}
                  </code>
                  <button
                    onClick={handleOpenInEditor}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Open in Editor
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={handleCopyDebugReport}
                  className="flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  {copied ? "Copied!" : "Copy Debug Report"}
                </button>
                <button
                  onClick={handleResetState}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                >
                  Reset App State
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 mt-8">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl bg-blue-500 text-white font-ot ot-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 pb-2 text-gray-400 font-ot ot-regular hover:text-gray-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

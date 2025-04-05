import React, { useState } from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
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

const ErrorPage: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [stackCopied, setStackCopied] = useState(false);

  // Get the error message
  const errorMessage = getErrorMessage(error);

  // Handle copy functionality
  const handleCopyError = async () => {
    try {
      if (error instanceof Error) {
        await navigator.clipboard.writeText(
          "Error: " +
            errorMessage +
            ', details: "' +
            error.stack +
            '", url: "' +
            window.location.href +
            '"'
        );
        setCopied(true);
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy error message:", err);
    }
  };

  // Handle copy stack trace
  const handleCopyStack = async () => {
    try {
      if (error instanceof Error) {
        await navigator.clipboard.writeText(error.stack || "");
        setStackCopied(true);
        // Reset copied state after 2 seconds
        setTimeout(() => setStackCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy stack trace:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-red-50 font-ot">
      <div className="w-full max-w-lg p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
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
          <h1 className="text-2xl font-ot ot-semibold text-gray-900 mb-4">
            Oops! Something went wrong
          </h1>

          {/* Error Message with Copy Button */}
          <div className="relative mb-8">
            <p className="text-gray-600 font-ot ot-regular">{errorMessage}</p>
            <button
              onClick={handleCopyError}
              className="mt-2 inline-flex items-center px-3 py-1 text-sm font-ot ot-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy Error
                </>
              )}
            </button>
          </div>

          {/* Technical Details (only in development) */}
          {import.meta.env.DEV && error instanceof Error && (
            <div className="mb-8">
              <details className="text-left">
                <summary className="text-sm font-ot ot-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  Technical Details
                </summary>
                <div className="relative">
                  <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs font-ot ot-regular text-gray-700 overflow-auto">
                    {error.stack}
                  </pre>
                  <button
                    onClick={handleCopyStack}
                    className="absolute top-4 right-4 inline-flex items-center px-2 py-1 text-xs font-ot ot-medium text-gray-700 bg-white/90 rounded-md hover:bg-white transition-colors border border-gray-200 shadow-sm"
                  >
                    {stackCopied ? (
                      <>
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Copy Stack
                      </>
                    )}
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl bg-black text-white font-ot ot-medium hover:bg-black/90 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 text-gray-500 font-ot ot-regular hover:text-gray-700"
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

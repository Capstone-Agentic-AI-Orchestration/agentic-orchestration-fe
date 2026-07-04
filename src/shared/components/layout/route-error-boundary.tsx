"use client";

import { ErrorBoundary } from "@/shared/components/ui/error-boundary";

/**
 * Route-level error boundary wrapper.
 * Wraps each route group to prevent one crash from taking down the whole app.
 * Logs errors to console in development.
 */
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, info) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[RouteErrorBoundary]", error, info.componentStack);
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

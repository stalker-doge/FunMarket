"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Something went wrong
        </h2>
        <p style={{ color: "#888", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

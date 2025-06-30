"use client";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (!token) {
        window.location.href = "/login";
      } else {
        setChecked(true);
      }
    }
  }, []);

  if (!checked) {
    return <div className="flex min-h-screen items-center justify-center">Checking authentication...</div>;
  }

  return <>{children}</>;
} 
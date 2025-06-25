import { useEffect } from "react";

export function useAuthRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
      window.location.href = "/login";
    }
  }, []);
} 
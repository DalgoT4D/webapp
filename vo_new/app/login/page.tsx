"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiPost, apiGet } from "@/lib/api";

interface Org {
  slug: string;
  name: string;
  viz_url: string;
}

interface OrgUser {
  email: string;
  org: Org;
  active: boolean;
  new_role_slug: string;
  permissions: string[];
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"login" | "org">("login");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [token, setToken] = useState("");

  // Check if user is already authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Adjust the API endpoint as needed
      const res = await apiPost("/api/login/", { username, password });
      if (res && res.token) {
        setToken(res.token);
        // Temporarily store token for org fetch
        localStorage.setItem("authToken", res.token);
        // Fetch orgs
        const orgUsers: OrgUser[] = await apiGet("/api/currentuserv2"); // Adjust endpoint as needed
        if (Array.isArray(orgUsers) && orgUsers.length > 0) {
          setOrgs(orgUsers.map((orgUser: OrgUser) => ( orgUser.org )));
          setStep("org");
        } else {
          setError("No organizations found for this user.");
        }
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) {
      setError("Please select an organization.");
      return;
    }
    // Store selected org in localStorage
    localStorage.setItem("selectedOrg", selectedOrg);
    // Optionally, you can update the token or user context here
    window.location.href = "/";
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("selectedOrg");
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black relative">
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      )}
      <form
        onSubmit={step === "login" ? handleLogin : handleOrgSelect}
        className="w-full max-w-sm space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {step === "login" && (
          <>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </>
        )}
        {step === "org" && (
          <>
            <div>
              <Label htmlFor="org">Select Organization</Label>
              <select
                id="org"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={selectedOrg}
                onChange={e => setSelectedOrg(e.target.value)}
                required
              >
                <option value="" disabled>
                  -- Select an organization --
                </option>
                {orgs.map(org => (
                  <option key={org.slug} value={org.slug}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? step === "login"
              ? "Logging in..."
              : "Loading organizations..."
            : step === "login"
            ? "Login"
            : "Continue"}
        </Button>
      </form>
    </div>
  );
} 
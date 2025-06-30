"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { useAuthStore, type Org } from "@/stores/authStore";

interface LoginForm {
  username: string;
  password: string;
}

interface OrgForm {
  selectedOrg: string;
}

interface OrgUser {
  email: string;
  org: Org;
  active: boolean;
  new_role_slug: string;
  permissions: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, token, setToken, setSelectedOrg, logout, initialize } = useAuthStore();

  // Initialize auth state from localStorage
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoggingIn },
    setError: setLoginError,
  } = useForm<LoginForm>();

  // Organization form  
  const {
    register: registerOrg,
    handleSubmit: handleOrgSubmit,
    formState: { errors: orgErrors, isSubmitting: isSelectingOrg },
    setError: setOrgError,
  } = useForm<OrgForm>();

  // Fetch organizations when we have a token
  const { data: orgUsers, error: orgError } = useSWR<OrgUser[]>(
    token ? "/api/currentuserv2" : null
  );

  const orgs = orgUsers?.map(orgUser => orgUser.org) || [];

  // Handle login
  const onLogin = async (data: LoginForm) => {
    try {
      const response = await apiPost("/api/login/", {
        username: data.username,
        password: data.password,
      });

      if (response?.token) {
        setToken(response.token);
      } else {
        setLoginError("root", { message: "Invalid response from server" });
      }
    } catch (error: any) {
      setLoginError("root", { message: error.message || "Login failed" });
    }
  };

  // Handle organization selection
  const onOrgSelect = async (data: OrgForm) => {
    if (!data.selectedOrg) {
      setOrgError("selectedOrg", { message: "Please select an organization" });
      return;
    }

    setSelectedOrg(data.selectedOrg);
    router.push("/");
  };

  // If authenticated and we have orgs, show org selection
  if (isAuthenticated && token && orgs.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black relative">
        <Button
          onClick={logout}
          variant="destructive"
          className="absolute top-4 right-4"
        >
          Logout
        </Button>

        <form
          onSubmit={handleOrgSubmit(onOrgSelect)}
          className="w-full max-w-sm space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900"
        >
          <h1 className="text-2xl font-bold mb-4 text-center">Select Organization</h1>

          <div>
            <Label htmlFor="selectedOrg">Organization</Label>
            <select
              id="selectedOrg"
              {...registerOrg("selectedOrg", { required: "Please select an organization" })}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="">-- Select an organization --</option>
              {orgs.map(org => (
                <option key={org.slug} value={org.slug}>
                  {org.name}
                </option>
              ))}
            </select>
            {orgErrors.selectedOrg && (
              <p className="text-red-600 text-sm mt-1">{orgErrors.selectedOrg.message}</p>
            )}
          </div>

          {orgError && (
            <div className="text-red-600 text-sm">
              {orgError.message || "Failed to load organizations"}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSelectingOrg}>
            {isSelectingOrg ? "Loading..." : "Continue"}
          </Button>
        </form>
      </div>
    );
  }

  // Show login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black relative">
      {isAuthenticated && (
        <Button
          onClick={logout}
          variant="destructive"
          className="absolute top-4 right-4"
        >
          Logout
        </Button>
      )}

      <form
        onSubmit={handleLoginSubmit(onLogin)}
        className="w-full max-w-sm space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-zinc-900"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            {...registerLogin("username", { required: "Username is required" })}
            className="mt-1"
          />
          {loginErrors.username && (
            <p className="text-red-600 text-sm mt-1">{loginErrors.username.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...registerLogin("password", { required: "Password is required" })}
            className="mt-1"
          />
          {loginErrors.password && (
            <p className="text-red-600 text-sm mt-1">{loginErrors.password.message}</p>
          )}
        </div>

        {loginErrors.root && (
          <div className="text-red-600 text-sm">{loginErrors.root.message}</div>
        )}

        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
} 
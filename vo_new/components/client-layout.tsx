"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { MainLayout } from "@/components/main-layout";

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    // Public routes (login, signup, etc.) - no auth guard or main layout
    return <>{children}</>;
  }

  // Protected routes - require authentication and include main layout
  return (
    <AuthGuard>
      <MainLayout>
        {children}
      </MainLayout>
    </AuthGuard>
  );
} 
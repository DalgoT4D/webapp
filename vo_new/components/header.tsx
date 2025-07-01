"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, User, LogOut, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore, type Org } from "@/stores/authStore";
import useSWR from "swr";

interface HeaderProps {
  onMenuToggle?: () => void;
  hideMenu?: boolean;
}

export function Header({ onMenuToggle, hideMenu = false }: HeaderProps) {
  const router = useRouter();
  const { 
    currentOrg, 
    orgUsers, 
    setSelectedOrg, 
    setOrgSwitching,
    isOrgSwitching,
    logout,
    getCurrentOrgUser 
  } = useAuthStore();
  
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);

  // Get current user email
  const currentOrgUser = getCurrentOrgUser();
  const userEmail = currentOrgUser?.email || "Unknown User";

  // Get user initials for avatar
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map(part => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  const handleOrgChange = async (orgSlug: string) => {
    // Don't allow switching if already switching
    if (isOrgSwitching) return;
    
    // Set switching state to show loading
    setOrgSwitching(true);
    
    // Update the selected org in store and localStorage
    setSelectedOrg(orgSlug);
    setIsOrgMenuOpen(false);
    
    try {
      // Show loader for minimum 2 seconds to give substantial feel
      const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for minimum delay then refresh
      await minDelay;
      
      // Refresh the page to trigger data refetch with new org context
      // This is essential for all API calls to use the new org header
      router.refresh();
      
      // Clear switching state after a slight delay to allow refresh to complete
      setTimeout(() => {
        setOrgSwitching(false);
      }, 500);
      
    } catch (error) {
      // If anything goes wrong, clear the switching state
      setOrgSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleChangePassword = () => {
    router.push("/settings");
  };

  // Available organizations for switching
  const availableOrgs = orgUsers.map(ou => ou.org);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo and Menu Toggle */}
        <div className="flex items-center gap-4">
          {!hideMenu && onMenuToggle && (
            <Button variant="ghost" size="icon" onClick={onMenuToggle}>
              <BarChart3 className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Dalgo</span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Organization Selector */}
          {currentOrg && availableOrgs.length > 1 && (
            <DropdownMenu open={isOrgMenuOpen} onOpenChange={setIsOrgMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isOrgSwitching}>
                  <span className="max-w-[150px] truncate">{currentOrg.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableOrgs
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((org) => (
                    <DropdownMenuItem
                      key={org.slug}
                      onClick={() => handleOrgChange(org.slug)}
                      className={currentOrg.slug === org.slug ? "bg-muted font-medium" : ""}
                      disabled={isOrgSwitching}
                    >
                      <span className="truncate">{org.name}</span>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Current organization name (when only one org) */}
          {currentOrg && availableOrgs.length === 1 && (
            <span className="text-sm font-medium text-muted-foreground max-w-[150px] truncate">
              {currentOrg.name}
            </span>
          )}

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userEmail}</p>
                  {currentOrg && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentOrg.name}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 
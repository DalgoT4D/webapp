"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, User, LogOut, ChevronDown, Bell, Menu, AlignJustify } from "lucide-react";
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
import { useAuthStore } from "@/stores/authStore";

interface HeaderProps {
  onMenuToggle?: () => void;
  hideMenu?: boolean;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ 
  onMenuToggle, 
  hideMenu = false, 
  onSidebarToggle,
  isSidebarCollapsed = false 
}: HeaderProps) {
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

  // Available organizations for switching
  const availableOrgs = orgUsers.map(ou => ou.org);

  return (
    <div className="flex h-16 items-center justify-between w-full">
      {/* Left side - Logo, Sidebar toggle, and status */}
      <div className="flex items-center gap-4">
        {/* Desktop Sidebar Toggle - Now with hamburger icon */}
        {onSidebarToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSidebarToggle}
            className="hidden md:flex h-9 w-9"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <AlignJustify className="h-5 w-5" />
          </Button>
        )}

        {/* Mobile Menu Toggle */}
        {!hideMenu && onMenuToggle && (
          <Button variant="ghost" size="icon" onClick={onMenuToggle} className="md:hidden h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
        
        {/* Dalgo Logo - Always visible */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">Dalgo</span>
        </div>

        {/* Organization switching status */}
        <div className="hidden md:block">
          {isOrgSwitching && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-primary font-medium">
                Switching organization...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">•</span>
          </span>
        </Button>

        {/* Organization Selector */}
        {currentOrg && availableOrgs.length > 1 && (
          <DropdownMenu open={isOrgMenuOpen} onOpenChange={setIsOrgMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 max-w-[200px] h-9" disabled={isOrgSwitching}>
                <span className="truncate font-medium">{currentOrg.name}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
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
                    {currentOrg.slug === org.slug && (
                      <span className="ml-auto text-xs text-primary">Current</span>
                    )}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Current organization name (when only one org) */}
        {currentOrg && availableOrgs.length === 1 && (
          <div className="px-3 py-1 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium text-foreground max-w-[150px] truncate">
              {currentOrg.name}
            </span>
          </div>
        )}

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm font-medium">{getInitials(userEmail)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{userEmail}</p>
                {currentOrg && (
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {currentOrg.name} • {currentOrgUser?.new_role_slug || "User"}
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
  );
} 
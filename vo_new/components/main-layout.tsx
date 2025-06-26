"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Database,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Power,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define types for navigation items
interface NavItemType {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  children?: NavItemType[]
}

// Define the navigation items with their routes and icons
const getNavItems = (currentPath: string): NavItemType[] => [
  {
    title: "Impact",
    href: "/",
    icon: Home,
    isActive: currentPath === "/",
  },
  {
    title: "Metrics",
    href: "/metrics",
    icon: BarChart3,
    isActive: currentPath.startsWith("/metrics"),
  },
  {
    title: "Charts",
    href: "/charts",
    icon: BarChart3,
    isActive: currentPath.startsWith("/charts"),
  },
  {
    title: "Dashboards",
    href: "/dashboards",
    icon: LayoutDashboard,
    isActive: currentPath.startsWith("/dashboards"),
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    isActive: currentPath.startsWith("/reports"),
  },
  {
    title: "Data",
    href: "/data",
    icon: Database,
    isActive: currentPath.startsWith("/data"),
    children: [
      {
        title: "Ingest",
        href: "/ingest",
        icon: Settings,
        isActive: currentPath.startsWith("/ingest"),
      },
      {
        title: "Transform",
        href: "/transform",
        icon: Settings,
        isActive: currentPath.startsWith("/transform"),
      },
      {
        title: "Orchestrate",
        href: "/orchestrate",
        icon: Settings,
        isActive: currentPath.startsWith("/orchestrate"),
      },
    ],
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: AlertTriangle,
    isActive: currentPath.startsWith("/alerts"),
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    isActive: currentPath.startsWith("/settings"),
  },
]

// Custom sidebar trigger with directional chevrons
function CustomSidebarTrigger() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

// Logo component that adapts to sidebar state
function Logo() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="flex items-center gap-2">
      <BarChart3 className="h-6 w-6 text-primary" />
      {!isCollapsed && <span className="text-xl font-bold">Dalgo</span>}
    </div>
  )
}

// Profile component that adapts to sidebar state
function Profile() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary">MH</span>
      </div>
      {!isCollapsed && (
        <div>
          <p className="text-sm font-medium">Maternal Health Org</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
      )}
    </div>
  )
}

// Add this component after your existing components
function NavItem({ item, level = 0 }: { item: NavItemType; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const hasChildren = item.children && item.children.length > 0

  // Auto-expand if any child is active
  useEffect(() => {
    if (hasChildren && item.children?.some(child => child.isActive)) {
      setIsExpanded(true)
    }
  }, [item.children, hasChildren])

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild={!hasChildren} 
          isActive={item.isActive} 
          tooltip={item.title}
          onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
        >
          {hasChildren ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )} 
              />
            </div>
          ) : (
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="ml-4 border-l pl-2">
          {item.children.map((child) => (
            <NavItem key={child.title} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </>
  )
}

// Mobile navigation item component
function MobileNavItem({ item, level = 0, onClose }: { item: NavItemType; level?: number; onClose: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  // Auto-expand if any child is active
  useEffect(() => {
    if (hasChildren && item.children?.some(child => child.isActive)) {
      setIsExpanded(true)
    }
  }, [item.children, hasChildren])

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm font-medium",
            item.isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5" />
            {item.title}
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )} 
          />
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
            item.isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.title}
        </Link>
      )}
      
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children.map((child) => (
            <MobileNavItem key={child.title} item={child} level={level + 1} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [navItems, setNavItems] = useState(getNavItems(pathname))
  const router = useRouter();

  // Update nav items when pathname changes
  useEffect(() => {
    setNavItems(getNavItems(pathname))
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("selectedOrg");
    router.push("/login");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex" collapsible="icon">
          <SidebarHeader className="border-b p-4 flex flex-col items-center gap-2">
            <Logo />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    <Power className="h-5 w-5 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="w-full flex justify-end mt-2">
              <CustomSidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {(navItems || []).map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <Profile />
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Sidebar */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">Dalgo</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            <div className="py-4">
              <nav className="grid gap-1 px-2">
                {(navItems || []).map((item) => (
                  <MobileNavItem key={item.title} item={item} onClose={() => setOpen(false)} />
                ))}
              </nav>
            </div>
            <div className="border-t p-4 mt-auto">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">MH</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Maternal Health Org</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
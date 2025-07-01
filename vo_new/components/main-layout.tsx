"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { 
  BarChart3, 
  Database, 
  Settings, 
  FileText, 
  AlertTriangle, 
  PanelLeftClose, 
  PanelLeft,
  ChevronDown,
  Monitor,
  Home,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Header } from "./header"
import { useAuthStore } from "@/stores/authStore"

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
  const { currentOrg, getCurrentOrgUser } = useAuthStore()
  const isCollapsed = state === "collapsed"
  
  const currentUser = getCurrentOrgUser()
  const userInitials = currentUser?.email 
    ? currentUser.email.split("@")[0].split(".").map(part => part.charAt(0).toUpperCase()).join("").slice(0, 2)
    : "U";

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary">{userInitials}</span>
      </div>
      {!isCollapsed && (
        <div>
          <p className="text-sm font-medium">{currentOrg?.name || "Organization"}</p>
          <p className="text-xs text-muted-foreground">{currentUser?.new_role_slug || "User"}</p>
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
            <Link href={item.href} className="flex items-center gap-2">
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="pl-4 border-l ml-6 space-y-1">
          {item.children?.map((child, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild isActive={child.isActive} tooltip={child.title}>
                <Link href={child.href} className="flex items-center gap-2">
                  <child.icon className="h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
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

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center justify-between w-full p-2 text-left rounded-md hover:bg-accent",
            item.isActive && "bg-accent"
          )}
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
        </button>
        {isExpanded && (
          <div className="ml-6 space-y-1">
            {item.children?.map((child, index) => (
              <Link
                key={index}
                href={child.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md hover:bg-accent",
                  child.isActive && "bg-accent"
                )}
              >
                <child.icon className="h-4 w-4" />
                <span>{child.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md hover:bg-accent",
        item.isActive && "bg-accent"
      )}
    >
      <item.icon className="h-5 w-5" />
      <span>{item.title}</span>
    </Link>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navItems = getNavItems(pathname)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <Header 
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            hideMenu={false}
          />

          <div className="flex flex-1">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden md:flex">
              <SidebarHeader className="p-4">
                <div className="flex items-center justify-between">
                  <Logo />
                  <CustomSidebarTrigger />
                </div>
              </SidebarHeader>
              
              <SidebarContent className="px-4">
                <SidebarMenu>
                  {navItems.map((item, index) => (
                    <NavItem key={index} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarContent>
              
              <SidebarFooter className="p-4">
                <Profile />
              </SidebarFooter>
            </Sidebar>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="left" className="p-0 w-72">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <Logo />
                  </div>
                  
                  <div className="flex-1 p-4 space-y-1">
                    {navItems.map((item, index) => (
                      <MobileNavItem 
                        key={index} 
                        item={item} 
                        onClose={() => setIsMobileMenuOpen(false)} 
                      />
                    ))}
                  </div>
                  
                  <div className="p-4 border-t">
                    <Profile />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
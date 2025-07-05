"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NEXT_PUBLIC_WEBAPP_ENVIRONMENT } from "@/constants/constants"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  BarChart3, 
  Database, 
  Settings, 
  FileText, 
  AlertTriangle, 
  ChevronDown,
  Home,
  LayoutDashboard
} from "lucide-react"
import IngestIcon from "@/assets/icons/ingest"
import TransformIcon from "@/assets/icons/transform"
import OrchestrateIcon from "@/assets/icons/orchestrate"
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

// Menu items to hide in production environment
const PRODUCTION_HIDDEN_ITEMS = [
  // Add menu item titles to hide in production
  "Metrics",
  "Reports",
  "Dashboards",
  "Alerts",
  "Settings",
]

// Function to filter menu items for production environment
const filterMenuItemsForProduction = (items: NavItemType[]): NavItemType[] => {
  if (NEXT_PUBLIC_WEBAPP_ENVIRONMENT !== "production") {
    return items // Show full menu for development and staging
  }
  
  return items.filter(item => {
    // Check if the main item should be hidden in production
    if (PRODUCTION_HIDDEN_ITEMS.includes(item.title)) {
      return false
    }
    
    // If item has children, filter them too
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children.filter(child => 
        !PRODUCTION_HIDDEN_ITEMS.includes(child.title)
      )
      
      // If all children are hidden, hide the parent too
      if (filteredChildren.length === 0) {
        return false
      }
      
      // Return item with filtered children
      return {
        ...item,
        children: filteredChildren
      }
    }
    
    return true
  })
}

// Define the navigation items with their routes and icons
const getNavItems = (currentPath: string): NavItemType[] => {
  const allNavItems: NavItemType[] = [
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
          icon: IngestIcon,
          isActive: currentPath.startsWith("/ingest"),
        },
        {
          title: "Transform",
          href: "/transform",
          icon: TransformIcon,
          isActive: currentPath.startsWith("/transform"),
        },
        {
          title: "Orchestrate",
          href: "/orchestrate",
          icon: OrchestrateIcon,
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

  // Filter menu items for production environment
  return filterMenuItemsForProduction(allNavItems)
}

// Flatten menu items for collapsed view
const getFlattenedNavItems = (items: NavItemType[]): NavItemType[] => {
  const flattened: NavItemType[] = []
  
  items.forEach(item => {
    flattened.push(item)
    if (item.children) {
      flattened.push(...item.children)
    }
  })
  
  return flattened
}

// Profile component for sidebar footer
function Profile({ isCollapsed }: { isCollapsed: boolean }) {
  const { currentOrg, getCurrentOrgUser } = useAuthStore()
  const currentUser = getCurrentOrgUser()
  const userInitials = currentUser?.email 
    ? currentUser.email.split("@")[0].split(".").map(part => part.charAt(0).toUpperCase()).join("").slice(0, 2)
    : "U";

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center p-3 rounded-lg bg-muted/20">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{userInitials}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <div className="text-sm">
              <p className="font-medium">{currentOrg?.name || "Organization"}</p>
              <p className="text-muted-foreground">{currentUser?.new_role_slug || "User"}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary">{userInitials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{currentOrg?.name || "Organization"}</p>
        <p className="text-xs text-muted-foreground truncate">{currentUser?.new_role_slug || "User"}</p>
      </div>
    </div>
  )
}

// Collapsed navigation item component
function CollapsedNavItem({ item }: { item: NavItemType }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center w-full p-3 rounded-lg hover:bg-accent/50 transition-colors group",
              item.isActive && "bg-accent font-medium"
            )}
          >
            <item.icon className="h-6 w-6 flex-shrink-0" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          <p className="font-medium">{item.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Expanded navigation item component
function ExpandedNavItem({ item }: { item: NavItemType }) {
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
            "flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-accent/50 transition-colors group",
            item.isActive && "bg-accent"
          )}
          title={item.title}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-6 w-6 flex-shrink-0" />
            <span className="font-medium">{item.title}</span>
          </div>
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform flex-shrink-0 text-muted-foreground group-hover:text-foreground",
              isExpanded && "rotate-180"
            )} 
          />
        </button>
        
        {isExpanded && (
          <div className="ml-8 space-y-1">
            {item.children?.map((child, index) => (
              <Link
                key={index}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-sm",
                  child.isActive && "bg-accent font-medium"
                )}
                title={child.title}
              >
                <child.icon className="h-6 w-6 flex-shrink-0" />
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
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group",
        item.isActive && "bg-accent font-medium"
      )}
      title={item.title}
    >
      <item.icon className="h-6 w-6 flex-shrink-0" />
      <span className="font-medium">{item.title}</span>
    </Link>
  )
}

// Mobile navigation item component
function MobileNavItem({ item, onClose }: { item: NavItemType; onClose: () => void }) {
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
            "flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-accent transition-colors",
            item.isActive && "bg-accent"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-6 w-6" />
            <span className="font-medium">{item.title}</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
        </button>
        {isExpanded && (
          <div className="ml-8 space-y-1">
            {item.children?.map((child, index) => (
              <Link
                key={index}
                href={child.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors",
                  child.isActive && "bg-accent"
                )}
              >
                <child.icon className="h-6 w-6 flex-shrink-0" />
                <span className="text-sm">{child.title}</span>
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
        "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors",
        item.isActive && "bg-accent"
      )}
    >
      <item.icon className="h-6 w-6 flex-shrink-0" />
      <span className="font-medium">{item.title}</span>
    </Link>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const navItems = getNavItems(pathname)
  const flattenedNavItems = getFlattenedNavItems(navItems)

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* SECTION 1: NAVBAR - Fixed Full Width */}
      <header className="h-16 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="h-full px-4 lg:px-6">
          <Header 
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            hideMenu={false}
            onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </div>
      </header>

      {/* CONTENT AREA: Remaining Height */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* SECTION 2: SIDEBAR - Fixed Width */}
        <aside className={cn(
          "hidden md:flex flex-col border-r bg-background transition-all duration-300 flex-shrink-0",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}>
          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isSidebarCollapsed ? (
              // Collapsed: Show all items (including nested) as individual icons with tooltips
              flattenedNavItems.map((item, index) => (
                <CollapsedNavItem key={`${item.href}-${index}`} item={item} />
              ))
            ) : (
              // Expanded: Show hierarchical structure
              navItems.map((item, index) => (
                <ExpandedNavItem key={index} item={item} />
              ))
            )}
          </div>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <Profile isCollapsed={isSidebarCollapsed} />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">Dalgo</span>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item, index) => (
                  <MobileNavItem 
                    key={index} 
                    item={item} 
                    onClose={() => setIsMobileMenuOpen(false)} 
                  />
                ))}
              </div>
              
              <div className="p-4 border-t">
                <Profile isCollapsed={false} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* SECTION 3: MAIN CONTENT AREA - Remaining Width */}
        <main className="flex-1 overflow-hidden bg-background">
          {/* Page Container - Fixed Width of Remaining Space */}
          <div className="h-full w-full overflow-auto">
            {/* Consistent Inner Padding Container */}
            <div className="p-6 h-full">
              {/* Content Area */}
              <div className="h-full w-full">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
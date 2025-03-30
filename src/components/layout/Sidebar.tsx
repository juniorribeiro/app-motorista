
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  Home,
  History,
  Settings,
  FileText,
  PlusCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Sidebar({ className }: SidebarProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, path: "/" },
    { id: "register", name: "Novo Registro", icon: PlusCircle, path: "/register" },
    { id: "history", name: "Histórico", icon: History, path: "/history" },
    { id: "reports", name: "Relatórios", icon: FileText, path: "/reports" },
    { id: "calendar", name: "Calendário", icon: Calendar, path: "/calendar" },
    { id: "analytics", name: "Análises", icon: BarChart3, path: "/analytics" },
    { id: "settings", name: "Configurações", icon: Settings, path: "/settings" },
  ];

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col border-r bg-sidebar",
        className
      )}
    >
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <div className="flex items-center gap-2 font-semibold text-lg text-primary">
          <span>DriverDash</span>
        </div>
      </div>
      <div className="flex-1">
        <nav className="grid gap-1 p-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "transparent hover:bg-accent/50"
                )
              }
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button className="w-full" variant="outline">
          <User className="mr-2 h-4 w-4" />
          Login
        </Button>
      </div>
    </div>
  );
}

function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

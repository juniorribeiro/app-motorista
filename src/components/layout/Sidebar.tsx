import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  PlusCircle,
  History,
  FileText,
  Settings,
  User,
  LogOut,
  Fuel,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isAuthenticated, userName, handleLogout } = useAuth();

  const handleAuth = () => {
    if (isAuthenticated) {
      handleLogout();
    } else {
      navigate("/login");
    }
  };

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, path: "/" },
    { id: "register-trip", name: "Nova Viagem", icon: PlusCircle, path: "/register-trip" },
    { id: "fuel", name: "Abastecimentos", icon: Fuel, path: "/fuel" },
    { id: "history", name: "Histórico", icon: History, path: "/history" },
    { id: "reports", name: "Relatórios", icon: FileText, path: "/reports" },
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
        <Button className="w-full" variant="outline" onClick={handleAuth}>
          {isAuthenticated ? (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" />
              Login
            </>
          )}
        </Button>
        {isAuthenticated && userName && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {userName}
          </p>
        )}
      </div>
    </div>
  );
}

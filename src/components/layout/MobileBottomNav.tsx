import React from "react";
import { NavLink } from "react-router-dom";
import { Receipt, PlusCircle, History, BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const navItems = [
    { id: "costs", name: "Custos", icon: Receipt, path: "/costs" },
    { id: "register-trip", name: "Nova Viagem", icon: PlusCircle, path: "/register-trip" },
    { id: "diary", name: "Diario", icon: BookOpenText, path: "/diary" },
    { id: "history", name: "Histórico", icon: History, path: "/history" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5 mb-1" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MobileBottomNav;

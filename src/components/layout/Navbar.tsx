import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Menu, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated, userName } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile Menu */}
        <div className="flex lg:hidden mr-2">
          {isAuthenticated && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar />
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="mr-4 hidden lg:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              DriverDash
            </span>
          </Link>
        </div>
        
        {/* Mobile Logo */}
        <div className="flex lg:hidden flex-1">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold inline-block">
              DriverDash
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Aqui você pode adicionar uma barra de pesquisa se desejar */}
          </div>
          <nav className="flex items-center">
            {isAuthenticated && (
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="relative">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {!isMobile && (
          <div className="w-64 hidden lg:block">
            <Sidebar />
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

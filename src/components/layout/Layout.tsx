import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  useEffect(() => {
    // اجعل اتجاه الصفحة بالكامل حسب اللغة
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [isRTL]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return <>{children}</>;
  }

  // حساب الهامش بناءً على حالة التصغير
  const sidebarWidth = sidebarCollapsed ? 64 : 256; // w-16 = 64px, w-64 = 256px
  const marginStyle = isRTL
    ? { marginRight: sidebarOpen ? sidebarWidth + 8 : 8, marginLeft: 8 }
    : { marginLeft: sidebarOpen ? sidebarWidth + 8 : 8, marginRight: 8 };

  return (
    <div 
      className={cn(
        "flex min-h-screen flex-col bg-muted/40",
        isRTL ? "rtl" : "ltr"
      )}
    >
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onCollapseChange={setSidebarCollapsed} />
        <main
          className={cn(
            "flex-1 transition-all duration-200 ease-in-out"
          )}
          style={marginStyle}
        >
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;

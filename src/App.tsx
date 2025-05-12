import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import Branches from "./pages/Branches";
import Cities from "./pages/Cities";
import Labs from "./pages/Labs";
import Departments from "./pages/Departments";
import Courses from "./pages/Courses";
import Instructors from "./pages/Instructors";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/auth/LoginForm";
import Messaging from "./pages/Messaging";
import Campaigns from "./pages/Campaigns";
import Leads from "./pages/Leads";
import Students from "./pages/Students";
import Booking from "./pages/Booking";
import Groups from "./pages/Groups";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";
import { initializeData } from "./utils/mockData";
import Roles from "./pages/Roles";
import Receipts from "./pages/Receipts";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Authentication wrapper
const AuthWrapper = () => {
  const { isAuthenticated } = useAuth();
  
  // Initialize mock data on app start
  useEffect(() => {
    initializeData();
  }, []);
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/cities" element={<Cities />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/instructors" element={<Instructors />} />
        <Route path="/messaging" element={<Messaging />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/students" element={<Students />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

// مكون توجيه المستخدم المصادق إلى الصفحة الرئيسية
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={
                <AuthRedirect>
                  <LoginForm />
                </AuthRedirect>
              } />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AuthWrapper />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

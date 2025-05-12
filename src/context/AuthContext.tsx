
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { saveToLocalStorage, getFromLocalStorage } from "@/utils/localStorage";
import { loginUser } from "@/api/coreApi";
import { LoginResponse } from "@/api/coreTypes";

type Role = "admin" | "employee" | "teacher" | "student";

interface User {
  id: number;
  name: string;
  role: Role;
  accessToken: string;
  email?: string;
  roles?: string[];
  expiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = "latin_academy_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = getFromLocalStorage<User | null>(AUTH_STORAGE_KEY, null);
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  // Real login function using the API
  const login = async (userNameOrEmail: string, password: string): Promise<boolean> => {
    console.log("Attempting login with API:", userNameOrEmail, password);
    
    try {
      const response = await loginUser(userNameOrEmail, password);
      
      console.log("API login response:", response);
      
      if (response.error || !response.data) {
        console.error("Login error:", response.error);
        return false;
      }
      
      const loginData = response.data;
      
      // طباعة بيانات الاستجابة للتحقق من التوكن
      console.log("Login data received:", JSON.stringify(loginData, null, 2));
      
      // التحقق من وجود التوكن
      if (!loginData.token && loginData.accessToken) {
        // إذا كان التوكن موجودًا في accessToken بدلاً من token
        console.log("Using accessToken instead of token");
        loginData.token = loginData.accessToken;
      } else if (!loginData.token) {
        console.error("Token is undefined in login response!");
        // إذا لم يكن هناك توكن، نضع قيمة افتراضية للاختبار
        loginData.token = "test_token_for_development";
      }
      
      console.log("Token to be used:", loginData.token);
      
      // Determine role based on the user's permissions or role property
      // This is a simplified example - adjust according to your actual API response
      let role: Role = "employee";
      if (loginData.roles && loginData.roles.length > 0) {
        if (loginData.roles.includes("Admin")) {
          role = "admin";
        } else if (loginData.roles.includes("Teacher")) {
          role = "teacher";
        } else if (loginData.roles.includes("Student")) {
          role = "student";
        }
      }
      
      // Store complete user data including token as accessToken
      const userData = {
        id: loginData.userId,
        name: loginData.userName || userNameOrEmail,
        role: role,
        accessToken: loginData.token, // نستخدم التوكن الذي تم التحقق منه مسبقًا
        email: loginData.email,
        roles: loginData.roles,
        expiresIn: loginData.expiresIn
      };
      
      console.log("User data to be stored:", userData);
      
      console.log("Saving user data to localStorage:", userData);
      try {
        // تخزين البيانات مباشرة في localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        
        // تخزين التوكن بشكل منفصل للتوافق مع الكود القديم
        localStorage.setItem("token", userData.accessToken);
        
        // تحقق من أن البيانات تم تخزينها بنجاح
        const savedData = localStorage.getItem(AUTH_STORAGE_KEY);
        console.log("Verified data in localStorage:", savedData);
        
        // تحديث حالة التطبيق
        setUser(userData);
        setIsAuthenticated(true);
      } catch (storageError) {
        console.error("Error saving to localStorage:", storageError);
      }
      return true;
    } catch (error) {
      console.error("Login API error:", error);
      return false;
    }
  };

  const logout = () => {
    try {
      console.log("Logging out...");
      // إزالة بيانات المستخدم من الحالة
      setUser(null);
      setIsAuthenticated(false);
      
      // إزالة البيانات من التخزين المحلي
      localStorage.removeItem(AUTH_STORAGE_KEY);
      console.log("Removed user data from localStorage");
      
      // توجيه المستخدم إلى صفحة تسجيل الدخول
      window.location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

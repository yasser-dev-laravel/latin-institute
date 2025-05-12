
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { UserCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [username, setUsername] = useState("root");
  const [password, setPassword] = useState("Root@12345");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // تسجيل الدخول تلقائيًا عند تحميل الصفحة
  useEffect(() => {
    const autoLogin = async () => {
      console.log("Auto login with:", username, password);
      try {
        setIsLoading(true);
        const success = await login(username, password);
        console.log("Auto login result:", success);
        
        if (success) {
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "مرحبا بك في نظام Latin Academy",
          });
          navigate('/');
        } else {
          console.error("Auto login failed");
        }
      } catch (error) {
        console.error("Auto login error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    autoLogin();
  }, [login, navigate, toast, username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMessage("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    console.log("Submitting login with:", username, password);
    
    try {
      const success = await login(username, password);
      console.log("Login result:", success);
      
      if (!success) {
        setErrorMessage("اسم المستخدم أو كلمة المرور غير صحيحة");
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحبا بك في نظام Latin Academy",
        });
        // توجيه المستخدم إلى الصفحة الرئيسية بعد تسجيل الدخول الناجح
        navigate('/');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى");
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <UserCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">مرحباً بك</CardTitle>
          <CardDescription>أدخل بيانات الدخول للوصول للنظام</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-center text-muted-foreground">
          <div className="w-full">
            <p className="mb-2">بيانات الدخول الافتراضية:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-bold">مدير النظام</p>
                <p>admin / admin123</p>
              </div>
              <div>
                <p className="font-bold">موظف</p>
                <p>employee / employee123</p>
              </div>
              <div>
                <p className="font-bold">مدرس</p>
                <p>teacher / teacher123</p>
              </div>
              <div>
                <p className="font-bold">طالب</p>
                <p>student / student123</p>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginForm;

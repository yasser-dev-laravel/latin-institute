
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { getAll } from "@/api/coreApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, BookText, Building, FolderOpen } from "lucide-react";

const DashboardCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  description?: string;
  icon: React.ElementType;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/20 p-1.5 text-primary">
          <Icon className="h-full w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const { user } = useAuth();
  
  // State for dashboard data
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch data from API when dashboard loads
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all required data in parallel
        const [studentsData, coursesData, branchesData, departmentsData] = await Promise.all([
          getAll<any>("Students/pagination"),
          getAll<any>("Courses/pagination"),
          getAll<any>("Branches/pagination"),
          getAll<any>("Categories/pagination") // Categories are equivalent to departments
        ]);
        
        console.log("API Response - Students:", studentsData);
        console.log("API Response - Courses:", coursesData);
        console.log("API Response - Branches:", branchesData);
        console.log("API Response - Departments:", departmentsData);
        
        // التحقق من هيكل البيانات واستخراج المصفوفة المناسبة
        const extractData = (response: any) => {
          if (!response) return [];
          
          // إذا كانت الاستجابة مصفوفة مباشرة
          if (Array.isArray(response)) return response;
          
          // إذا كانت الاستجابة تحتوي على خاصية data وهي مصفوفة
          if (response.data && Array.isArray(response.data)) return response.data;
          
          // إذا كانت الاستجابة تحتوي على خاصية items وهي مصفوفة
          if (response.items && Array.isArray(response.items)) return response.items;
          
          // إذا كانت الاستجابة تحتوي على خاصية results وهي مصفوفة
          if (response.results && Array.isArray(response.results)) return response.results;
          
          // إذا لم نتمكن من العثور على البيانات، نعيد مصفوفة فارغة
          return [];
        };
        
        setStudents(extractData(studentsData));
        setCourses(extractData(coursesData));
        setBranches(extractData(branchesData));
        setDepartments(extractData(departmentsData));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (!user) {
    return null;
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-6 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">خطأ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
            <button 
              className="mt-4 w-full bg-primary text-white py-2 rounded-md"
              onClick={() => window.location.reload()}
            >
              إعادة المحاولة
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">مرحباً {user.name}!</h2>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analytics" disabled>التحليلات</TabsTrigger>
          <TabsTrigger value="reports" disabled>التقارير</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="إجمالي الطلاب"
              value={(students?.length || 0).toString()}
              description="مجموع الطلاب المسجلين بالنظام"
              icon={Users}
            />
            <DashboardCard
              title="الكورسات"
              value={(courses?.length || 0).toString()}
              description="عدد الكورسات المتاحة"
              icon={BookOpen}
            />
            <DashboardCard
              title="الأقسام"
              value={(departments?.length || 0).toString()}
              description="عدد الأقسام الدراسية"
              icon={FolderOpen}
            />
            <DashboardCard
              title="الفروع"
              value={branches.length.toString()}
              description="عدد فروع الأكاديمية"
              icon={Building}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>الكورسات الحالية</CardTitle>
                <CardDescription>
                  نظرة عامة على الكورسات المتاحة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.map((course: any, index: number) => (
                      <div key={course.id || index} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <BookText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.code || `COURSE-${index+1}`} - {course.levels?.length || 0} مستويات
                            </p>
                          </div>
                        </div>
                        <div className="text-sm">
                          {course.totalDuration || 0} ساعة | {course.totalPrice || 0} جنيه
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    لا توجد كورسات متاحة حالياً
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>الفروع</CardTitle>
                <CardDescription>
                  فروع الأكاديمية المتاحة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {branches.length > 0 ? (
                  <div className="space-y-2">
                    {branches.map((branch: any, index: number) => (
                      <div key={branch.id || index} className="flex items-center gap-2 border-b pb-2">
                        <Building className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{branch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {branch.address || 'غير محدد'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    لا توجد فروع متاحة حالياً
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;

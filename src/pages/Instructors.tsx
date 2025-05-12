import { useState, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Trash, Pencil, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getAll, create, deleteById, edit } from "@/api/coreApi";
import { InstructorGetByIdType, InstructorCreateType, InstructorEditType, InstructorSalaryTypeEnum, CourseGetByIdType } from "@/api/coreTypes";

const Instructors = () => {
  const [instructors, setInstructors] = useState<InstructorGetByIdType[]>([]);
  const [courses, setCourses] = useState<CourseGetByIdType[]>([]);
  const [cities, setCities] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  
  // Filter instructors based on search term and city filter
  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      // Filter by search term
      const matchesSearch = searchTerm === "" || 
        instructor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.nationalId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by city
      const matchesCity = cityFilter === "" || cityFilter === "all" || instructor.cityId?.toString() === cityFilter;
      
      return matchesSearch && matchesCity;
    });
  }, [instructors, searchTerm, cityFilter]);
  const [formData, setFormData] = useState<Partial<InstructorCreateType>>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    nationalId: "",
    cityId: null,
    salary: 0,
    salaryTypeId: InstructorSalaryTypeEnum.Monthly,
    coursesIds: []
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInstructorId, setEditInstructorId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  // Handle form field changes - supports both event-based and direct value updates
  const handleChange = (eventOrFieldName: React.ChangeEvent<HTMLInputElement> | string, value?: any) => {
    if (typeof eventOrFieldName === 'string') {
      // Direct field update with name and value
      setFormData(prev => ({
        ...prev,
        [eventOrFieldName]: value
      }));
    } else {
      // Event-based update from input fields
      const { name, value: eventValue } = eventOrFieldName.target;
      setFormData(prev => ({
        ...prev,
        [name]: eventValue
      }));
    }
  };
  
  // Handle multi-select changes (for coursesIds)
  const handleMultiSelectChange = (selectedIds: number[]) => {
    setFormData(prev => ({
      ...prev,
      coursesIds: selectedIds
    }));
  };

// تحميل البيانات من API
const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // جلب المحاضرين والكورسات والمدن بالتوازي
    const [instructorsData, coursesData, citiesData] = await Promise.all([
      getAll<InstructorGetByIdType[]>("Instructors/pagination"),
      getAll<CourseGetByIdType[]>("Courses/pagination"),
      getAll<{id: number, name: string}[]>("Cityes/pagination")
    ]);
    
    console.log("API Response - Instructors:", instructorsData);
    console.log("API Response - Courses:", coursesData);
    console.log("API Response - Cities:", citiesData);
    
    // استخراج البيانات من الاستجابة
    const extractData = (response: any) => {
      if (!response) return [];
      if (Array.isArray(response)) return response;
      if (response.data && Array.isArray(response.data)) return response.data;
      if (response.items && Array.isArray(response.items)) return response.items;
      if (response.results && Array.isArray(response.results)) return response.results;
      return [];
    };
    
    setInstructors(extractData(instructorsData));
    setCourses(extractData(coursesData));
    setCities(extractData(citiesData));
  } catch (err) {
    console.error("Error fetching instructors data:", err);
    setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.");
  } finally {
    setLoading(false);
  }
};

// تنفيذ استدعاء البيانات عند تحميل الصفحة أو عند تغيير refreshTrigger
useEffect(() => {
  fetchData();
}, [refreshTrigger]);

// معالجة تقديم النموذج
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // التحقق من البيانات المطلوبة
  if (!formData.name || !formData.email || !formData.nationalId) {
    toast({
      title: "خطأ في البيانات",
      description: "يرجى ملء جميع الحقول المطلوبة",
      variant: "destructive",
    });
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    let successMessage = "";
    
    if (isEditMode && editInstructorId) {
      // تعديل محاضر موجود
      const instructorData: InstructorEditType = {
        id: editInstructorId,
        phone: formData.phone || null,
        address: formData.address || null,
        nationalId: formData.nationalId || null,
        cityId: formData.cityId || null,
        salary: formData.salary || 0,
        salaryTypeId: formData.salaryTypeId || InstructorSalaryTypeEnum.Monthly,
        coursesIds: formData.coursesIds || []
      };
      
      // تنفيذ طلب التعديل
      const updatedInstructor = await edit<InstructorGetByIdType>("Instructors", editInstructorId, instructorData);
      
      // تحديث المحاضر في الحالة
      setInstructors(prev => 
        prev.map(instructor => instructor.id === editInstructorId ? 
          {...instructor, ...updatedInstructor} : instructor
        )
      );
      
      successMessage = "تم تعديل المحاضر بنجاح";
    } else {
      // إنشاء محاضر جديد
      const instructorData: InstructorCreateType = {
        name: formData.name,
        email: formData.email,
        password: formData.password || null,
        phone: formData.phone || null,
        address: formData.address || null,
        nationalId: formData.nationalId || null,
        cityId: formData.cityId || null,
        salary: formData.salary || 0,
        salaryTypeId: formData.salaryTypeId || InstructorSalaryTypeEnum.Monthly,
        coursesIds: formData.coursesIds || []
      };
      
      // تنفيذ طلب الإنشاء
      const newInstructor = await create<InstructorGetByIdType>("Instructors", instructorData);
      
      // إضافة المحاضر الجديد إلى الحالة
      setInstructors(prev => [...prev, newInstructor]);
      
      successMessage = "تم إضافة المحاضر بنجاح";
    }
    
    // عرض رسالة النجاح
    toast({
      title: "تم بنجاح",
      description: successMessage,
    });
    
    // إعادة تعيين النموذج وإغلاق الحوار وتحديث البيانات
    resetForm();
    setIsDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
    
  } catch (error: any) {
    // معالجة الخطأ
    console.error("Error with instructor operation:", error);
    
    const errorTitle = isEditMode ? "خطأ في تعديل المحاضر" : "خطأ في إنشاء المحاضر";
    const defaultErrorMsg = isEditMode ? "حدث خطأ أثناء محاولة تعديل المحاضر" : "حدث خطأ أثناء محاولة إضافة المحاضر";
    
    toast({
      title: errorTitle,
      description: error.response?.data?.message || defaultErrorMsg,
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
// معالجة الحذف
const handleDelete = async (id: number) => {
  try {
    // حذف المحاضر باستخدام API
    await deleteById("Instructors", id);
    
    // تحديث البيانات بعد الحذف
    setRefreshTrigger(prev => prev + 1);
    
    toast({
      title: "تم بنجاح",
      description: "تم حذف المحاضر بنجاح",
    });
  } catch (error) {
    console.error("Error deleting instructor:", error);
    toast({
      title: "خطأ في الحذف",
      description: "حدث خطأ أثناء محاولة حذف المحاضر. يرجى المحاولة مرة أخرى.",
      variant: "destructive",
    });
  }
};

// معالجة تأكيد الحذف
const confirmDelete = (id: number) => {
  setPendingDeleteId(id);
  setIsDeleteDialogOpen(true);
};

const handleConfirmDelete = () => {
  if (pendingDeleteId !== null) {
    handleDelete(pendingDeleteId);
    setPendingDeleteId(null);
  }
  setIsDeleteDialogOpen(false);
};
// إعادة تعيين النموذج
const resetForm = () => {
  setFormData({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    nationalId: "",
    cityId: null,
    salary: 0,
    salaryTypeId: InstructorSalaryTypeEnum.Monthly,
    coursesIds: []
  });
  setIsEditMode(false);
  setEditInstructorId(null);
};
// تحميل بيانات المحاضر للتعديل
const handleEdit = (instructor: InstructorGetByIdType) => {
  setFormData({
    name: instructor.name || "",
    email: instructor.email || "",
    phone: instructor.phone || "",
    address: instructor.address || "",
    nationalId: instructor.nationalId || "",
    cityId: instructor.cityId || null,
    salary: instructor.salary || 0,
    salaryTypeId: instructor.salaryTypeId || InstructorSalaryTypeEnum.Monthly,
    coursesIds: instructor.coursesIds || []
  });
  setEditInstructorId(instructor.id);
  setIsEditMode(true);
  setIsDialogOpen(true);
};
// عرض حالة التحميل
if (loading) {
  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// عرض حالة الخطأ
if (error) {
  return (
    <div className="p-4 md:p-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-500">خطأ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">{error}</p>
          <Button 
            className="mt-4 w-full"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main UI
return (
  <div className="p-4 md:p-8">
    {/* Header with search and add button */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold">إدارة المحاضرين</h1>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن محاضر..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* City filter */}
        <Select
          value={cityFilter}
          onValueChange={setCityFilter}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="جميع المدن" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المدن</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Add button */}
        <Button className="w-full sm:w-auto" onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> إضافة محاضر
        </Button>
      </div>
    </div>
    
    {/* Instructors list */}
    {filteredInstructors.length > 0 ? (
      <div className="space-y-6">
        {filteredInstructors.map((instructor) => (
          <Card key={instructor.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>{instructor.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(instructor)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDelete(instructor.id)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <div className="text-xs flex items-center">
                    <span className="font-medium ml-1">البريد الإلكتروني:</span> {instructor.email || "غير محدد"}
                  </div>
                  <div className="text-xs flex items-center">
                    <span className="font-medium ml-1">الهاتف:</span> {instructor.phone || "غير محدد"}
                  </div>
                  <div className="text-xs flex items-center">
                    <span className="font-medium ml-1">الرقم القومي:</span> {instructor.nationalId || "غير محدد"}
                  </div>
                  <div className="text-xs flex items-center">
                    <span className="font-medium ml-1">المدينة:</span> {instructor.cityName || "غير محدد"}
                  </div>
                  <div className="text-xs flex items-center">
                    <span className="font-medium ml-1">نوع الراتب:</span> {instructor.salaryTypeName || "غير محدد"}
                  </div>
                  <div className="text-xs flex items-center">
                    <span className="font-medium ml-1">الراتب:</span> {instructor.salary || 0}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="font-semibold text-xs">الكورسات:</span>
                  {instructor.coursesNames && instructor.coursesNames.length > 0 ? (
                    instructor.coursesNames.map((name, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs">
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">لا توجد كورسات</span>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    ) : (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          لم يتم العثور على محاضرين. قم بإضافة محاضرين جدد.
        </CardContent>
      </Card>
    )}
    
    {/* Dialog for adding/editing instructors */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "تعديل محاضر" : "إضافة محاضر جديد"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "قم بتعديل بيانات المحاضر" : "قم بإدخال بيانات المحاضر الجديد"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المحاضر *</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="اسم المحاضر"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@example.com"
                required
              />
            </div>
            
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input 
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="كلمة المرور"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input 
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="رقم الهاتف"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationalId">الرقم القومي *</Label>
              <Input 
                id="nationalId"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="الرقم القومي"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input 
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="العنوان"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cityId">المدينة</Label>
              <Select 
                name="cityId"
                value={formData.cityId?.toString() || ""}
                onValueChange={(value) => handleChange("cityId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salaryTypeId">نوع الراتب</Label>
              <Select 
                name="salaryTypeId"
                value={formData.salaryTypeId?.toString() || ""}
                onValueChange={(value) => handleChange("salaryTypeId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الراتب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InstructorSalaryTypeEnum.Monthly.toString()}>شهري</SelectItem>
                  <SelectItem value={InstructorSalaryTypeEnum.PerSession.toString()}>لكل محاضرة</SelectItem>
                  <SelectItem value={InstructorSalaryTypeEnum.PerStudent.toString()}>لكل طالب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salary">الراتب</Label>
              <Input 
                id="salary"
                name="salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
                placeholder="الراتب"
                min={0}
              />
            </div>
            
            <div className="space-y-2">
              <Label>الكورسات</Label>
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <label key={course.id} className="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.coursesIds?.includes(course.id) || false}
                      onChange={e => {
                        const selected = new Set(formData.coursesIds || []);
                        if (e.target.checked) selected.add(course.id);
                        else selected.delete(course.id);
                        handleMultiSelectChange(Array.from(selected));
                      }}
                    />
                    {course.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري {isEditMode ? "التعديل" : "الإضافة"}...
                </>
              ) : (
                isEditMode ? "تعديل" : "إضافة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف هذا المحاضر نهائياً. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
};
export default Instructors;





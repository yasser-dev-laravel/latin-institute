import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Layers, Plus, Search, Trash, Pencil, ChevronDown, ChevronRight, Clock, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getAll, create, deleteById, edit } from "@/api/coreApi";
import { CourseGetByIdType, CourseCreateType, CourseEditType, CategoryGetByIdType, LevelCreateType, LevelEditType } from "@/api/coreTypes";

const Courses = () => {
  const [courses, setCourses] = useState<CourseGetByIdType[]>([]);
  const [categories, setCategories] = useState<CategoryGetByIdType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<CourseCreateType>>({
    name: "",
    description: "",
    categoryId: 0,
    isActive: true,
    levels: []
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  // تحميل البيانات من API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // جلب الكورسات والأقسام بالتوازي
      const [coursesData, categoriesData] = await Promise.all([
        getAll<CourseGetByIdType[]>("Courses/pagination"),
        getAll<CategoryGetByIdType[]>("Categories/pagination")
      ]);
      
      console.log("API Response - Courses:", coursesData);
      console.log("API Response - Categories:", categoriesData);
      
      // استخراج البيانات من الاستجابة
      const extractData = (response: any) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        if (response.items && Array.isArray(response.items)) return response.items;
        if (response.results && Array.isArray(response.results)) return response.results;
        return [];
      };
      
      setCourses(extractData(coursesData));
      setCategories(extractData(categoriesData));
    } catch (err) {
      console.error("Error fetching courses data:", err);
      setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
  
  // تنفيذ استدعاء البيانات عند تحميل الصفحة أو عند تغيير refreshTrigger
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);
  
  // إضافة مستوى افتراضي عند تحميل الصفحة
  useEffect(() => {
    if (!formData.levels || formData.levels.length === 0) {
      const defaultLevel: LevelCreateType = {
        name: "المستوى 1",
        description: "",
        price: 0,
        sessionsCount: 0,
        sessionsDiortion: 0
      };
      
      setFormData(prevData => ({
        ...prevData,
        levels: [defaultLevel]
      }));
    }
  }, []);

  // معالجة البحث
  const filteredCourses = courses.filter(
    (course) => 
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.id?.toString().includes(searchTerm)
  );

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: parseInt(value) });
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    // إضافة مستوى افتراضي أول
    const defaultLevel: LevelCreateType = {
      name: "المستوى 1",
      description: "",
      price: 0,
      sessionsCount: 0,
      sessionsDiortion: 0
    };
    
    setFormData({
      name: "",
      description: "",
      categoryId: 0,
      isActive: true,
      levels: [defaultLevel]
    });
    setIsEditMode(false);
    setEditCourseId(null);
  };

  // معالجة تقديم النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.categoryId) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    // التأكد من وجود مستوى واحد على الأقل
    if (!formData.levels || formData.levels.length === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب إضافة مستوى واحد على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    // التحقق من مدة المحاضرة لكل مستوى
    const levelsWithMissingDuration = formData.levels.filter(level => !level.sessionsDiortion);
    if (levelsWithMissingDuration.length > 0) {
      toast({
        title: "خطأ في بيانات المستويات",
        description: "يجب تحديد مدة المحاضرة لكل مستوى",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && editCourseId) {
        // تعديل كورس موجود
        const courseData: CourseEditType = {
          id: editCourseId,
          name: formData.name,
          description: formData.description || "",
          categoryId: formData.categoryId,
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          levels: (formData.levels || []).map(level => {
            // تحقق مما إذا كان المستوى موجودًا (له معرف) أم جديدًا
            if ('id' in level) {
              // مستوى موجود
              return {
                id: (level as any).id,
                name: level.name,
                description: level.description || "",
                price: level.price || 0,
                sessionsCount: level.sessionsCount || 0,
                sessionsDiortion: level.sessionsDiortion || 0
              };
            } else {
              // مستوى جديد (بدون معرف)
              return {
                name: level.name,
                description: level.description || "",
                price: level.price || 0,
                sessionsCount: level.sessionsCount || 0,
                sessionsDiortion: level.sessionsDiortion || 0
              };
            }
          }) as LevelEditType[]
        };
        
        console.log("Updating course:", courseData);
        
        const updatedCourse = await edit<CourseGetByIdType>("Courses", editCourseId, courseData);
        console.log("API Response - Updated Course:", updatedCourse);
        
        // تحديث الكورس في الحالة
        const updatedCourses = courses.map(course => 
          course.id === editCourseId ? {...course, ...updatedCourse} : course
        );
        setCourses(updatedCourses);
        
        toast({
          title: "تم بنجاح",
          description: "تم تعديل الكورس بنجاح",
        });
      } else {
        // إنشاء كورس جديد باستخدام API
        const courseData: CourseCreateType = {
          name: formData.name,
          description: formData.description || "",
          categoryId: formData.categoryId,
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          levels: (formData.levels || []).map(level => ({
            name: level.name,
            description: level.description || "",
            price: level.price || 0,
            sessionsCount: level.sessionsCount || 0,
            sessionsDiortion: level.sessionsDiortion || 0
            // لا نرسل الكود لأنه يتم تعيينه تلقائيًا في قاعدة البيانات
          })) as LevelCreateType[]
        };
        
        console.log("Creating new course:", courseData);
        
        try {
          // محاولة إنشاء الكورس باستخدام POST
          const newCourse = await create<CourseGetByIdType>("Courses", courseData);
          console.log("API Response - New Course:", newCourse);
          
          // إضافة الكورس الجديد إلى الحالة
          setCourses([...courses, newCourse]);
          
          toast({
            title: "تم بنجاح",
            description: "تم إضافة الكورس بنجاح",
          });
        } catch (error: any) {
          console.error("Error creating course with POST:", error);
          
          // إذا كان الخطأ 409 (تعارض)، قد يكون هناك مشكلة مع المسار
          if (error.response && error.response.status === 409) {
            toast({
              title: "خطأ في إنشاء الكورس",
              description: "يوجد تعارض مع كورس موجود بالفعل. يرجى التحقق من اسم الكورس والمعلومات الأخرى.",
              variant: "destructive",
            });
          } else {
            // إعادة رمي الخطأ ليتم التعامل معه في الجزء الخارجي من الدالة
            throw error;
          }
        }
      }
      
      // إعادة تعيين النموذج وإغلاق الحوار وتحديث البيانات
      resetForm();
      setIsDialogOpen(false);
      // تحديث البيانات بعد الإضافة أو التعديل
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Error with course operation:", error);
      toast({
        title: "خطأ في العملية",
        description: isEditMode 
          ? "حدث خطأ أثناء محاولة تعديل الكورس. يرجى المحاولة مرة أخرى."
          : "حدث خطأ أثناء محاولة إضافة الكورس. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // تحميل بيانات الكورس للتعديل
  const handleEdit = (course: CourseGetByIdType) => {
    setFormData({
      name: course.name,
      description: course.description || "",
      categoryId: course.categoryId,
      isActive: course.isActive,
      levels: course.levels || []
    });
    setEditCourseId(course.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // معالجة الحذف
  const handleDelete = async (id: number) => {
    try {
      // حذف الكورس باستخدام API
      await deleteById("Courses", id);
      
      // تحديث البيانات بعد الحذف
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف الكورس بنجاح",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الكورس. يرجى المحاولة مرة أخرى.",
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

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "غير معروف";
  };

  const handleAddLevel = () => {
    const currentLevels = formData.levels || [];
    const nextNumber = currentLevels.length + 1;
    
    const newLevel: LevelCreateType = {
      name: `المستوى ${nextNumber}`,
      description: "",
      price: 0,
      sessionsCount: 0,
      sessionsDiortion: 0
    };
    
    setFormData({
      ...formData,
      levels: [...currentLevels, newLevel]
    });
  };

  const handleLevelChange = (idx: number, field: string, value: any) => {
    const updatedLevels = [...(formData.levels || [])];
    updatedLevels[idx] = { ...updatedLevels[idx], [field]: value };
    setFormData({ ...formData, levels: updatedLevels });
  };

  const handleRemoveLevel = (idx: number) => {
    // منع حذف المستوى الأول (idx === 0)
    if (idx === 0) {
      toast({
        title: "لا يمكن حذف المستوى الأول",
        description: "المستوى الأول إجباري ولا يمكن حذفه",
        variant: "destructive",
      });
      return;
    }
    
    const updatedLevels = [...(formData.levels || [])];
    updatedLevels.splice(idx, 1);
    setFormData({ ...formData, levels: updatedLevels });
  };

  const calculateTotalPrice = (levels: any[] = []) => {
    return levels.reduce((sum, level) => sum + (parseFloat(String(level.price)) || 0), 0);
  };

  const calculateTotalDuration = (levels: any[] = []) => {
    return levels.reduce((sum, level) => {
      const sessions = parseInt(String(level.sessionsCount)) || 0;
      const duration = parseFloat(String(level.sessionsDiortion)) || 0;
      return sum + (sessions * duration);
    }, 0);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">إدارة الكورسات</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن كورس..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) resetForm();
              setIsDialogOpen(open);
            }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="h-4 w-4 ml-2" />
                إضافة كورس
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "تعديل الكورس" : "إضافة كورس جديد"}</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الكورس الجديد.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الكورس *</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="مثال: اللغة الإنجليزية للمبتدئين"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">وصف الكورس</Label>
                    <Textarea 
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="وصف مختصر للكورس"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">القسم *</Label>
                    <Select 
                      name="categoryId"
                      value={formData.categoryId?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("categoryId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">المستويات</Label>
                      <Button type="button" size="sm" variant="outline" onClick={handleAddLevel}>
                        <Plus className="h-4 w-4 ml-1" /> <span className="text-xs">إضافة مستوى</span>
                      </Button>
                    </div>
                    <div className="flex gap-4 mb-3 text-xs">
                      <div className="font-semibold">اجمالي السعر: <span className="text-blue-700">{calculateTotalPrice(formData.levels)}</span> جنيه</div>
                      <div className="font-semibold">اجمالي الساعات: <span className="text-blue-700">{calculateTotalDuration(formData.levels)}</span> ساعة</div>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="flex gap-2 mb-1 px-1 text-[11px] font-bold text-gray-600">
                        <div className="w-24 text-center">اسم المستوى</div>
                        <div className="w-20 text-center">سعر</div>
                        <div className="w-20 text-center">عدد المحاضرات</div>
                        <div className="w-20 text-center">مدة المحاضرة</div>
                        <div className="w-14 text-center">إجراء</div>
                      </div>
                      <div className="max-h-48 overflow-y-auto pr-1">
                        {(formData.levels || []).map((level, idx) => (
                          <div key={idx} className="flex gap-2 mb-1 items-center">
                            <Input
                              className="w-24 h-8 text-xs px-2"
                              value={level.name || `المستوى ${idx + 1}`}
                              onChange={e => handleLevelChange(idx, "name", e.target.value)}
                              placeholder="اسم المستوى"
                            />
                            <Input
                              className="w-20 h-8 text-xs px-2"
                              value={level.price}
                              type="number"
                              min={0}
                              onChange={e => handleLevelChange(idx, "price", parseFloat(e.target.value))}
                              placeholder="سعر المستوى"
                            />
                            <Input
                              className="w-20 h-8 text-xs px-2"
                              value={level.sessionsCount}
                              type="number"
                              min={0}
                              onChange={e => handleLevelChange(idx, "sessionsCount", parseInt(e.target.value))}
                              placeholder="عدد المحاضرات"
                            />
                            <Input
                              className="w-20 h-8 text-xs px-2"
                              value={level.sessionsDiortion}
                              type="number"
                              min={0}
                              onChange={e => handleLevelChange(idx, "sessionsDiortion", parseFloat(e.target.value))}
                              placeholder="مدة المحاضرة"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7"
                              onClick={() => handleRemoveLevel(idx)}
                              disabled={idx === 0} // تعطيل زر الحذف للمستوى الأول
                              title={idx === 0 ? "لا يمكن حذف المستوى الأول" : "حذف المستوى"}
                            >
                              <Trash className={`h-4 w-4 ${idx === 0 ? 'text-gray-400' : 'text-destructive'}`} />
                            </Button>
                          </div>
                        ))}
                      </div>
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
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="space-y-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle>{course.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(course)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(course.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <div className="text-xs flex items-center">
                      <span className="font-medium ml-1">الكود:</span> {course.code}
                    </div>
                    <div className="text-xs flex items-center">
                      <span className="font-medium ml-1">القسم:</span> {getCategoryName(course.categoryId)}
                    </div>
                    <div className="text-xs flex items-center">
                      <span className="font-medium ml-1">المدة الإجمالية:</span> {course.totalDuration} ساعة
                    </div>
                    <div className="text-xs flex items-center">
                      <span className="font-medium ml-1">السعر الإجمالي:</span> {course.totalPrice} جنيه
                    </div>
                  </div>
                  {course.description && (
                    <p className="mt-2 text-sm">{course.description}</p>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-1">
                <Accordion type="single" collapsible>
                  <AccordionItem value="levels">
                    <AccordionTrigger className="text-sm font-medium py-2">
                      المستويات ({course.levels?.length || 0})
                    </AccordionTrigger>
                    <AccordionContent>
                      {course.levels && course.levels.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>الكود</TableHead>
                                <TableHead>المستوى</TableHead>
                                <TableHead>عدد المحاضرات</TableHead>
                                <TableHead>مدة المحاضرة</TableHead>
                                <TableHead>السعر</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {course.levels.map((level) => (
                                <TableRow key={level.id}>
                                  <TableCell className="font-medium">{level.code}</TableCell>
                                  <TableCell>{level.name}</TableCell>
                                  <TableCell>{level.sessionsCount} محاضرة</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span>{level.sessionsDiortion} ساعة</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{level.price} جنيه</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center p-4 text-muted-foreground">
                          لا توجد مستويات لهذا الكورس
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لم يتم العثور على كورسات. قم بإضافة كورسات جديدة.
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الكورس نهائياً. لا يمكن التراجع عن هذا الإجراء.
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

export default Courses;

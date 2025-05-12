import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, Loader2, Calendar, Clock, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import * as coreApi from "@/api/coreApi";
import { GroupGetByIdType, GroupCreateType, GroupEditType, CourseGetByIdType, LevelGetByIdType, BrancheGetByIdType, RoomGetByIdType, InstructorGetByIdType, StudentGetByIdType } from "@/api/coreTypes";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// حالات المجموعة
const GROUP_STATUSES = [
  { id: 1, name: "نشطة" },
  { id: 2, name: "انتظار" },
  { id: 3, name: "مؤجلة" },
  { id: 4, name: "ملغية" },
  { id: 5, name: "منتهية" }
];

// نوع بيانات أيام الأسبوع
type WeekDayType = {
  id: number;
  name: string;
  value: number;
};

// أيام الأسبوع (قيمة افتراضية حتى يتم تحميل البيانات من API)
const DEFAULT_WEEK_DAYS: WeekDayType[] = [
  
  
  { id: 1, name: "الاثنين", value: 2 },
  { id: 2, name: "الثلاثاء", value: 4 },
  { id: 3, name: "الأربعاء", value: 8 },
  { id: 4, name: "الخميس", value: 16 },
  { id: 5, name: "الجمعة", value: 32 },
  { id: 6, name: "السبت", value: 64},
  { id: 7, name: "الأحد", value: 1 },
];

// تنسيق التاريخ بالعربية
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "";
  return format(new Date(dateString), "dd MMMM yyyy", { locale: ar });
}

// تنسيق الوقت
function formatTime(timeString: string | null | undefined) {
  if (!timeString) return "";
  return timeString.substring(0, 5); // يأخذ فقط الساعة والدقيقة (HH:MM)
}

export default function Groups() {
  const [groups, setGroups] = useState<GroupGetByIdType[]>([]);
  const [courses, setCourses] = useState<CourseGetByIdType[]>([]);
  const [levels, setLevels] = useState<LevelGetByIdType[]>([]);
  const [branches, setBranches] = useState<BrancheGetByIdType[]>([]);
  const [rooms, setRooms] = useState<RoomGetByIdType[]>([]);
  const [instructors, setInstructors] = useState<InstructorGetByIdType[]>([]);
  const [students, setStudents] = useState<StudentGetByIdType[]>([]);
  const [weekDays, setWeekDays] = useState<WeekDayType[]>(DEFAULT_WEEK_DAYS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Estados para filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Estados para diálogos
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupGetByIdType | null>(null);
  
  // Estado para formulario
  const [formData, setFormData] = useState<GroupCreateType>({
    name: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    instructorId: 0,
    levelId: 0,
    roomId: 0,
    statusId: 1,
    studentIds: [],
    days: []
  });
  
  // Estados para filtrado de selecciones en cascada (no son parte del formulario)
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  
  // Estado para mensajes de error en la fecha
  const [dateError, setDateError] = useState<string>("");

  const [searchStudent, setSearchStudent] = useState("");
  const { toast } = useToast();

  // Función para extraer datos de diferentes formatos de respuesta API
  const extractData = (response: any) => {
    console.log("API Response:", response);
    
    // Si es un array, devolverlo directamente
    if (Array.isArray(response)) {
      return response;
    }
    
    // Si tiene data.items (formato común de paginación)
    if (response?.data?.items) {
      return response.data.items;
    }
    
    // Si tiene data.results (otro formato común)
    if (response?.data?.results) {
      return response.data.results;
    }
    
    // Si tiene items directamente
    if (response?.items) {
      return response.items;
    }
    
    // Si tiene results directamente
    if (response?.results) {
      return response.results;
    }
    
    // Si tiene data y es un array
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    
    // Si no se puede extraer, devolver un array vacío
    console.warn("No se pudo extraer datos de la respuesta:", response);
    return [];
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [groupsData, coursesData, branchesData, roomsData, instructorsData, studentsData, weekDaysData] = await Promise.all([
          coreApi.getAll<any>("Groups/pagination"),
          coreApi.getAll<any>("Courses/pagination"),
          coreApi.getAll<any>("Branches/pagination"),
          coreApi.getAll<any>("Rooms/pagination"),
          coreApi.getAll<any>("Instructors/pagination"),
          coreApi.getAll<any>("Students/pagination"),
          coreApi.getAll<any>("HelpTables/GroupDays")
        ]);
        
        const processedGroups = extractData(groupsData);
        const processedCourses = extractData(coursesData);
        const processedBranches = extractData(branchesData);
        const processedRooms = extractData(roomsData);
        const processedInstructors = extractData(instructorsData);
        const processedStudents = extractData(studentsData);
        const processedWeekDays = extractData(weekDaysData);
        
        // Depurar estructura de datos
        console.log("Cursos:", processedCourses);
        console.log("Niveles de cursos:", processedCourses.map(c => ({ courseId: c.id, levels: c.levels })));
        console.log("Branches:", processedBranches);
        console.log("Rooms:", processedRooms.map(r => ({ id: r.id, name: r.name, branchId: r.branchId, branchName: r.branchName })));
        console.log("Instructores:", processedInstructors.map(i => ({ id: i.id, name: i.name, coursesIds: i.coursesIds })));
        console.log("Días de la semana:", processedWeekDays);
        
        setGroups(processedGroups);
        setCourses(processedCourses);
        setBranches(processedBranches);
        setRooms(processedRooms);
        setInstructors(processedInstructors);
        setStudents(processedStudents);
        
        // Establecer los días de la semana desde la API
        // if (processedWeekDays && processedWeekDays.length > 0) {
        //   setWeekDays(processedWeekDays);
        // }
        
        // Cargar niveles si hay cursos disponibles
        if (processedCourses.length > 0) {
          const allLevels: LevelGetByIdType[] = [];
          processedCourses.forEach(course => {
            if (course.levels && course.levels.length > 0) {
              // Asegurarse de que cada nivel tenga la propiedad courseId
              const levelsWithCourseId = course.levels.map(level => ({
                ...level,
                courseId: level.courseId || course.id // Usar courseId existente o asignar el ID del curso
              }));
              allLevels.push(...levelsWithCourseId);
            }
          });
          console.log("Todos los niveles con courseId:", allLevels);
          setLevels(allLevels);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل البيانات، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Filtrado de grupos
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = searchTerm === "" || 
        (group.name && group.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (group.instructorName && group.instructorName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        group.statusId.toString() === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [groups, searchTerm, statusFilter]);

  // Filtrado de estudiantes para la selección
  const filteredStudents = useMemo(() => {
    if (searchStudent.trim() === "") return students;
    return students.filter(s => 
      (s.name && s.name.toLowerCase().includes(searchStudent.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchStudent.toLowerCase())) ||
      (s.phone && s.phone.toLowerCase().includes(searchStudent.toLowerCase()))
    );
  }, [searchStudent, students]);

  // Función para abrir el diálogo de creación
  const handleAddGroup = () => {
    setIsEditMode(false);
    setSelectedCourseId(0);
    setSelectedBranchId(0);
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      instructorId: 0,
      levelId: 0,
      roomId: 0,
      statusId: 1,
      studentIds: [],
      days: []
    });
    setIsDialogOpen(true);
  };

  // Función para abrir el diálogo de edición
  const handleEditGroup = (group: GroupGetByIdType) => {
    setIsEditMode(true);
    setSelectedGroup(group);
    
    // Convertir los datos del grupo al formato del formulario
    const editData: GroupEditType = {
      id: group.id,
      name: group.name,
      startDate: group.startDate,
      endDate: group.endDate,
      startTime: group.startTime,
      endTime: group.endTime,
      instructorId: group.instructorId,
      levelId: group.levelId,
      roomId: group.roomId,
      statusId: group.statusId,
      studentIds: group.students?.map(s => s.id) || [],
      days: group.daysArray || []
    };
    
    // Encontrar el curso correspondiente al nivel
    const level = levels.find(l => l.id === group.levelId);
    if (level) {
      setSelectedCourseId(level.courseId);
    }
    
    // Encontrar el branch correspondiente a la sala
    const room = rooms.find(r => r.id === group.roomId);
    if (room) {
      setSelectedBranchId(room.branchId);
    }
    
    setFormData(editData as any);
    setIsDialogOpen(true);
  };

  // Función para abrir el diálogo de eliminación
  const handleDeleteGroup = (group: GroupGetByIdType) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  // Función para manejar cambios en el formulario
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Si se están cambiando los días, resetear fechas
      if (field === "days" && Array.isArray(value)) {
        // Resetear la fecha de inicio cuando cambian los días
        newFormData.startDate = "";
        newFormData.endDate = "";
        setDateError("");
      }
      
      // Si se está cambiando la fecha de inicio, calcular la fecha de fin
      if (field === "startDate" && value && newFormData.days && newFormData.days.length > 0) {
        // Buscar el nivel seleccionado para obtener el número de clases
        const selectedLevel = levels.find(l => l.id === newFormData.levelId);
        let classesCount = 0;
        
        // الحصول على عدد المحاضرات من المستوى
        if (selectedLevel) {
          // استخدام خاصية sessionsCount الموجودة في كائن المستوى
          if (selectedLevel.sessionsCount) {
            classesCount = selectedLevel.sessionsCount-1;
            console.log(`عدد المحاضرات من sessionsCount: ${classesCount}`);
          } else {
            // محاولة الحصول على عدد المحاضرات من خصائص أخرى
            classesCount = (selectedLevel as any).classCount || (selectedLevel as any).classesCount || 0;
            
            // إذا لم يتم العثور على عدد المحاضرات، البحث في كائن الكورس
            if (!classesCount) {
              const selectedCourse = courses.find(c => c.id === selectedLevel.courseId);
              if (selectedCourse?.levels) {
                const levelInCourse = selectedCourse.levels.find(l => l.id === selectedLevel.id);
                if (levelInCourse) {
                  classesCount = (levelInCourse as any).sessionsCount || (levelInCourse as any).classCount || (levelInCourse as any).classesCount || 0;
                }
              }
            }
          }
        }
        
        // إذا لم يتم العثور على عدد المحاضرات، استخدام قيمة افتراضية 5
        if (!classesCount) {
          classesCount = 5; // قيمة افتراضية 5 محاضرات
          console.log(`استخدام عدد محاضرات افتراضي: ${classesCount}`);
        } else {
          console.log(`عدد المحاضرات للمستوى ${selectedLevel?.name}: ${classesCount}`);
        }
        
        // حساب تاريخ نهاية الكورس بناءً على عدد المحاضرات وأيام الكورس وتاريخ البداية
        if (classesCount > 0) {
          console.log(`عدد المحاضرات المطلوبة للكورس: ${classesCount}`);
          
          // تحويل تاريخ البداية إلى كائن Date
          const startDate = new Date(value);
          console.log(`تاريخ بداية الكورس: ${startDate.toISOString().split('T')[0]}`);
          
          // الحصول على الأيام المحددة للكورس
          const selectedDays = newFormData.days as number[];
          console.log(`الأيام المحددة للكورس: ${selectedDays.map(d => getArabicDayName(d)).join(', ')}`);
          
          // التحقق من وجود أيام محددة
          if (selectedDays.length === 0) {
            console.error('لم يتم تحديد أي أيام للكورس');
            return newFormData;
          }
          
          // إنشاء نسخة من تاريخ البداية للعمل عليها
          let currentDate = new Date(startDate);
          let classesDone = 0;
          let lecturesDates = [];
          
          // حساب تاريخ المحاضرات حتى نصل إلى عدد المحاضرات المطلوب
          while (classesDone < classesCount) {
            // الانتقال لليوم التالي
            currentDate.setDate(currentDate.getDate() + 1);
            
            // الحصول على رقم اليوم في الأسبوع (0 = الأحد, 1 = الاثنين, ...)
            const jsDay = currentDate.getDay();
            
            // التحقق مما إذا كان هذا اليوم من ضمن أيام الكورس
            if (selectedDays.includes(jsDay)) {
              classesDone++;
              const lectureDate = new Date(currentDate);
              lecturesDates.push(lectureDate);
              console.log(`المحاضرة ${classesDone}/${classesCount}: ${getArabicDayName(jsDay)} ${lectureDate.toISOString().split('T')[0]}`);
            }
          }
          
          // المحاضرة الأخيرة هي تاريخ نهاية الكورس
          const endDateFormatted = currentDate.toISOString().split('T')[0];
          console.log(`تاريخ نهاية الكورس المحسوب: ${endDateFormatted}`);
          newFormData.endDate = endDateFormatted;
        }
      }
      
      // إذا تم تغيير المستوى أو الكورس، قم بحساب تاريخ النهاية إذا كان هناك تاريخ بداية موجود
      if ((field === "levelId" || field === "courseId") && formData.startDate && newFormData.days && newFormData.days.length > 0) {
        const selectedLevel = levels.find(l => l.id === newFormData.levelId);
        let classesCount = 0;

        if (selectedLevel) {
          if (selectedLevel.sessionsCount) {
            classesCount = selectedLevel.sessionsCount - 1;
          } else {
            classesCount = (selectedLevel as any).classCount || (selectedLevel as any).classesCount || 0;

            if (!classesCount) {
              const selectedCourse = courses.find(c => c.id === selectedLevel.courseId);
              if (selectedCourse?.levels) {
                const levelInCourse = selectedCourse.levels.find(l => l.id === selectedLevel.id);
                if (levelInCourse) {
                  classesCount = (levelInCourse as any).sessionsCount || (levelInCourse as any).classCount || (levelInCourse as any).classesCount || 0;
                }
              }
            }
          }
        }

        if (!classesCount) {
          classesCount = 5; // قيمة افتراضية
        }

        if (classesCount > 0) {
          const startDate = new Date(formData.startDate);
          const selectedDays = newFormData.days as number[];

          if (selectedDays.length === 0) {
            return newFormData;
          }

          let currentDate = new Date(startDate);
          let classesDone = 0;

          while (classesDone < classesCount) {
            currentDate.setDate(currentDate.getDate() + 1);
            const jsDay = currentDate.getDay();

            if (selectedDays.includes(jsDay)) {
              classesDone++;
            }
          }

          const endDateFormatted = currentDate.toISOString().split('T')[0];
          newFormData.endDate = endDateFormatted;
        }
      }
      
      return newFormData;
    });
  };

  // Función para manejar la selección de estudiantes
  const handleStudentSelect = (id: number) => {
    setFormData(prev => {
      const currentIds = prev.studentIds || [];
      const newIds = currentIds.includes(id) 
        ? currentIds.filter(sid => sid !== id) 
        : [...currentIds, id];
      
      return {
        ...prev,
        studentIds: newIds
      };
    });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.levelId || !formData.instructorId || !formData.roomId || !formData.startTime || !formData.startDate) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && selectedGroup) {
        // تعديل مجموعة موجودة
        const editedGroup = await coreApi.edit<GroupGetByIdType>("Groups", selectedGroup.id, formData);
        
        // تحديث قائمة المجموعات بالمجموعة المعدلة
        setGroups(prev => prev.map(g => g.id === editedGroup.id ? editedGroup : g));
        
        toast({
          title: "تم تعديل المجموعة بنجاح",
          description: `تم تعديل المجموعة ${editedGroup.name} بنجاح`,
        });
      } else {
        // إنشاء مجموعة جديدة
        const newGroup = await coreApi.create<GroupGetByIdType>("Groups", formData);
        
        // تحديث قائمة المجموعات بإضافة المجموعة الجديدة
        const updatedGroups = [...groups, newGroup];
        setGroups(updatedGroups);
        
        // للتأكد من أن المجموعة الجديدة تظهر في القائمة
        console.log("المجموعات بعد الإضافة:", updatedGroups);
        
        toast({
          title: "تم إنشاء المجموعة بنجاح",
          description: `تم إنشاء المجموعة ${newGroup.name} بنجاح`,
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error al guardar la grupo:", error);
      toast({
        title: "خطأ في حفظ البيانات",
        description: `حدث خطأ أثناء ${isEditMode ? "تعديل" : "إنشاء"} المجموعة، يرجى المحاولة مرة أخرى`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para eliminar un grupo
  const handleConfirmDelete = async () => {
    if (!selectedGroup) return;
    
    setIsSubmitting(true);
    
    try {
      await coreApi.deleteById("Groups", selectedGroup.id);
      
      setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
      
      toast({
        title: "تم حذف المجموعة بنجاح",
        description: `تم حذف المجموعة ${selectedGroup.name} بنجاح`,
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error al eliminar la grupo:", error);
      toast({
        title: "خطأ في حذف البيانات",
        description: "حدث خطأ أثناء حذف المجموعة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener el nombre del curso y nivel a partir del ID del nivel
  const getCourseAndLevelNameByLevelId = (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return { courseName: "", levelName: "" };
    
    const course = courses.find(c => c.id === level.courseId);
    return {
      courseName: course ? course.name : "",
      levelName: level.name || ""
    };
  };

  // Obtener el nombre del estado a partir del ID
  const getStatusName = (statusId: number) => {
    const status = GROUP_STATUSES.find(s => s.id === statusId);
    return status ? status.name : "";
  };

  // Obtener los nombres de los días a partir de los IDs
  const getDaysNames = (daysArray: number[] | undefined) => {
    if (!daysArray || daysArray.length === 0) return "";
    
    return daysArray
      .map(dayId => {
        const day = weekDays.find(d => d.id === dayId);
        return day ? day.name : "";
      })
      .filter(Boolean)
      .join(", ");
  };
  
  // Función para obtener el nombre del día en árabe
  const getArabicDayName = (dayIndex: number) => {
    const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return arabicDays[dayIndex];
  };
  
  // Convertir el índice de JavaScript (0-6) al ID correspondiente en DEFAULT_WEEK_DAYS
  const convertJsDayToId = (jsDay: number): number => {
    switch (jsDay) {
      case 0: return 7; // الأحد
      case 1: return 1; // الاثنين
      case 2: return 2; // الثلاثاء
      case 3: return 3; // الأربعاء
      case 4: return 4; // الخميس
      case 5: return 5; // الجمعة
      case 6: return 6; // السبت
      default: return -1;
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>المجموعات</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddGroup}>
              إضافة مجموعة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="بحث عن مجموعة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {GROUP_STATUSES.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد مجموعات متاحة
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الكورس</TableHead>
                      <TableHead>المحاضر</TableHead>
                      <TableHead>تاريخ البداية</TableHead>
                      <TableHead>تاريخ النهاية</TableHead>
                      <TableHead>الأيام</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>
                          {(() => {
                            const { courseName, levelName } = getCourseAndLevelNameByLevelId(group.levelId);
                            return (
                              <div>
                                <div className="font-medium">{courseName}</div>
                                <div className="text-xs text-muted-foreground">{levelName}</div>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{group.instructorName}</TableCell>
                        <TableCell>{formatDate(group.startDate)}</TableCell>
                        <TableCell>{formatDate(group.endDate)}</TableCell>
                        <TableCell>{getDaysNames(group.daysArray)}</TableCell>
                        <TableCell>{formatTime(group.startTime)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            group.statusId === 1 ? "bg-green-100 text-green-800" :
                            group.statusId === 2 ? "bg-yellow-100 text-yellow-800" :
                            group.statusId === 3 ? "bg-orange-100 text-orange-800" :
                            group.statusId === 4 ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {getStatusName(group.statusId)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/groups/${group.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditGroup(group)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding/editing groups */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "تعديل مجموعة" : "إضافة مجموعة جديدة"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "قم بتعديل بيانات المجموعة" : "قم بإدخال بيانات المجموعة الجديدة"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="overflow-y-auto pr-1">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المجموعة *</Label>
                  <Input 
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="اسم المجموعة"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="courseId">الكورس *</Label>
                  <Select 
                    value={selectedCourseId ? selectedCourseId.toString() : ""}
                    onValueChange={(value) => {
                      const courseId = parseInt(value);
                      setSelectedCourseId(courseId);
                      
                      // Buscar el primer nivel del curso y seleccionarlo automáticamente
                      const selectedCourse = courses.find(c => c.id === courseId);
                      let firstLevelId = 0;
                      
                      // Primero intentar encontrar niveles en el array de niveles filtrados
                      const courseLevels = levels.filter(level => level.courseId === courseId);
                      if (courseLevels.length > 0) {
                        firstLevelId = courseLevels[0].id;
                      } 
                      // Si no hay niveles filtrados, buscar en el objeto del curso
                       if (selectedCourse?.levels?.length > 0) {
                        firstLevelId = selectedCourse.levels[0].id;
                      }
                      
                      // Reset instructor when course changes, but set the first level
                      setFormData(prev => ({
                        ...prev,
                        levelId: firstLevelId,
                        instructorId: 0,
                        // Resetear fechas y días cuando cambia el curso
                        days: [],
                        startDate: "",
                        endDate: ""
                      }));
                      
                      // Resetear mensaje de error de fecha
                      setDateError("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكورس" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="levelId">المستوى *</Label>
                  <Select 
                    value={formData.levelId ? formData.levelId.toString() : ""}
                    onValueChange={(value) => handleChange("levelId", parseInt(value))}
                    disabled={!selectedCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Filtrar niveles por curso seleccionado */}
                      {levels
                        .filter(level => {
                          if (!selectedCourseId) return false;
                          return level.courseId === selectedCourseId;
                        })
                        .map((level ,idx)=> (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.name} 
                          </SelectItem>
                          
                        ))}
                        
                      {/* Si no hay niveles con courseId, mostrar niveles del objeto curso */}
                      {selectedCourseId && levels.filter(level => level.courseId === selectedCourseId).length === 0 && 
                        courses
                          .filter(course => course.id === selectedCourseId && course.levels && course.levels.length > 0)
                          .flatMap(course => course.levels)
                          .map(level => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                  {formData.levelId > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {(() => {
                        const selectedLevel = levels.find(l => l.id === formData.levelId);
                        if (selectedLevel) {
                          return (
                            <>
                              <span> المحاضرات: {selectedLevel.sessionsCount || "--"}</span>
                              <span> -الزمن: {selectedLevel.sessionsDiortion || "--"} </span>
                              {selectedLevel.price && <span> -المبلغ: {selectedLevel.price}</span>}
                            </>
                          );
                        }
                        return <div>لا توجد معلومات للمستوى المحدد</div>;
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branchId">الفرع *</Label>
                  <Select 
                    value={selectedBranchId ? selectedBranchId.toString() : ""}
                    onValueChange={(value) => {
                      const branchId = parseInt(value);
                      setSelectedBranchId(branchId);
                      // Reset room when branch changes
                      setFormData(prev => ({
                        ...prev,
                        roomId: 0
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorId">المحاضر *</Label>
                  <Select 
                    value={formData.instructorId ? formData.instructorId.toString() : ""}
                    onValueChange={(value) => handleChange("instructorId", parseInt(value))}
                    disabled={!selectedCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المحاضر" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors
                        .filter(instructor => {
                          // Si el instructor tiene coursesIds, filtrar por el curso seleccionado
                          if (instructor.coursesIds && Array.isArray(instructor.coursesIds)) {
                            return instructor.coursesIds.includes(selectedCourseId);
                          }
                          // Si no tiene coursesIds, mostrar todos los instructores
                          return true;
                        })
                        .map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id.toString()}>
                            {instructor.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="statusId">الحالة *</Label>
                  <Select 
                    value={formData.statusId ? formData.statusId.toString() : "1"}
                    onValueChange={(value) => handleChange("statusId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_STATUSES.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">القاعة *</Label>
                  <Select 
                    value={formData.roomId ? formData.roomId.toString() : ""}
                    onValueChange={(value) => handleChange("roomId", parseInt(value))}
                    disabled={!selectedBranchId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القاعة" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Filtrar salas por branch seleccionado */}
                      {rooms
                        .filter(room => {
                          if (!selectedBranchId) return false;
                          return room.branchId === selectedBranchId;
                        })
                        .map(room => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                        
                      {/* Si no hay salas con branchId, intentar filtrar por nombre */}
                      {selectedBranchId && rooms.filter(room => room.branchId === selectedBranchId).length === 0 && 
                        (() => {
                          const selectedBranch = branches.find(b => b.id === selectedBranchId);
                          if (!selectedBranch) return null;
                          
                          return rooms
                            .filter(room => room.branchName && room.branchName.includes(selectedBranch.name))
                            .map(room => (
                              <SelectItem key={room.id} value={room.id.toString()}>
                                {room.name} ({room.branchName})
                              </SelectItem>
                            ));
                        })()
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="statusId">الحالة *</Label>
                  <Select 
                    value={formData.statusId ? formData.statusId.toString() : "1"}
                    onValueChange={(value) => handleChange("statusId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_STATUSES.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>أيام المحاضرات *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 0, name: "الأحد" },
                    { id: 1, name: "الاثنين" },
                    { id: 2, name: "الثلاثاء" },
                    { id: 3, name: "الأربعاء" },
                    { id: 4, name: "الخميس" },
                    { id: 5, name: "الجمعة" },
                    { id: 6, name: "السبت" }
                  ].map((day) => (
                    <div key={day.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id={`day-${day.id}`}
                        checked={(formData.days || []).includes(day.id)}
                        onCheckedChange={(checked) => {
                          const currentDays = formData.days || [];
                          const newDays = checked 
                            ? [...currentDays, day.id]
                            : currentDays.filter(d => d !== day.id);
                          handleChange("days", newDays);
                        }}
                        disabled={!formData.levelId} // Deshabilitar hasta que se seleccione un nivel
                      />
                      <Label htmlFor={`day-${day.id}`} className="mr-2">{day.name}</Label>
                    </div>
                  ))}
                </div>
                {formData.days && formData.days.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    تم اختيار {formData.days.length} أيام: {getDaysNames(formData.days)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    تاريخ البداية *
                    {(formData.days || []).length === 0 && (
                      <span className="text-xs text-muted-foreground mr-2">
                        (اختر أيام المحاضرات أولاً)
                      </span>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-right ${!formData.startDate ? "text-muted-foreground" : ""} ${dateError ? "border-red-500" : ""}`}
                        disabled={(formData.days || []).length === 0}
                      >
                        <Calendar className="ml-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(new Date(formData.startDate), "EEEE dd MMMM yyyy", { locale: ar })
                        ) : (
                          <span>اختر تاريخ البداية</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.startDate ? new Date(formData.startDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // ضبط الوقت إلى منتصف الليل لتجنب مشاكل المنطقة الزمنية
                              const selectedDate = new Date(
                                date.getFullYear(),
                                date.getMonth(),
                                date.getDate(),
                                12, 0, 0 // ضبط الوقت إلى الساعة 12 ظهرًا
                              );
                              
                              console.log("\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u062d\u062f\u062f:", selectedDate.toISOString());
                              
                              // التحقق من أيام المحاضرات المحددة
                              const selectedDays = formData.days as number[] || [];
                              
                              // إذا لم يتم تحديد أي أيام للمحاضرات، عرض رسالة خطأ
                              if (selectedDays.length === 0) {
                                setDateError("يجب اختيار أيام المحاضرات أولاً");
                                return;
                              }
                              
                              // الحصول على يوم الأسبوع (0-6) من التاريخ المحدد
                              const jsDay = selectedDate.getDay(); // 0 = الأحد، 1 = الاثنين، إلخ
                              
                              // تحويل قيمة getDay إلى المعرف المناسب من DEFAULT_WEEK_DAYS
                              const dayId = convertJsDayToId(jsDay);
                              
                              // طباعة معلومات للتصحيح
                              console.log("اليوم المحدد من JavaScript:", jsDay);
                              console.log("معرف اليوم المناسب للمقارنة:", dayId);
                              console.log("أيام المجموعة المحددة:", selectedDays);
                              
                              // الحصول على اسم اليوم بالعربية
                              const dayName = getArabicDayName(jsDay);
                              
                              // التحقق من توافق اليوم مع أيام المحاضرات
                              if (!selectedDays.includes(dayId)) {
                                // عرض رسالة خطأ فورية وإعادة تعيين التاريخ
                                alert(`لا يمكن اختيار يوم ${dayName} لأنه ليس من أيام المحاضرات المحددة`);
                                // إعادة تعيين التاريخ
                                handleChange("startDate", "");
                                return;
                              }
                              
                              // Si el día coincide, limpiar error y actualizar fecha
                              setDateError("");
                              // استخدام التاريخ المعدل لتجنب مشاكل المنطقة الزمنية
                              const formattedDate = selectedDate.toISOString().split('T')[0];
                              console.log("\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u0646\u0633\u0642:", formattedDate);
                              handleChange("startDate", formattedDate);
                            }
                          }}
                          disabled={(date) => {
                            // تعطيل التواريخ السابقة
                            if (isBefore(date, new Date()) && !isSameDay(date, new Date())) {
                              return true;
                            }
                            
                            // تعطيل الأيام التي لا تتوافق مع أيام المجموعة المحددة
                            const selectedDays = formData.days as number[] || [];
                            if (selectedDays.length > 0) {
                              const jsDay = date.getDay(); // الحصول على يوم الأسبوع (0-6)
                              
                              // تحويل قيمة getDay إلى المعرف المناسب من DEFAULT_WEEK_DAYS
                              const dayId = convertJsDayToId(jsDay);
                              
                              if (!selectedDays.includes(dayId)) {
                                return true; // تعطيل اليوم إذا لم يكن ضمن الأيام المحددة
                              }
                            }
                            
                            return false;
                          }}
                          locale={ar}
                          className="border rounded-md"
                        />
                        {dateError && (
                          <div className="p-2 text-xs text-red-500">
                            {dateError}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    تاريخ النهاية
                    <span className="text-xs text-muted-foreground mr-2">
                      (يحسب تلقائياً)
                    </span>
                  </Label>
                  <Input 
                    id="endDate"
                    type="text"
                    value={formData.endDate ? format(new Date(formData.endDate), "EEEE dd MMMM yyyy", { locale: ar }) : ""}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">وقت البداية *</Label>
                  <Input 
                    id="startTime"
                    type="time"
                    value={formData.startTime || ""}
                    onChange={(e) => handleChange("startTime", e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">وقت النهاية</Label>
                  <Input 
                    id="endTime"
                    type="time"
                    value={formData.endTime || ""}
                    onChange={(e) => handleChange("endTime", e.target.value)}
                  />
                </div>
              </div>
              

              
              
              
              <div className="space-y-2">
                <Label>الطلاب</Label>
                <div className="border rounded-md p-2">
                  <div className="mb-2">
                    <Input 
                      placeholder="بحث عن طالب..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-2 text-muted-foreground">
                        لا يوجد طلاب مطابقين للبحث
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox 
                              id={`student-${student.id}`}
                              checked={(formData.studentIds || []).includes(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id)}
                            />
                            <Label htmlFor={`student-${student.id}`} className="mr-2">
                              {student.name} {student.phone && `(${student.phone})`}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Alert dialog for delete confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه المجموعة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المجموعة نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

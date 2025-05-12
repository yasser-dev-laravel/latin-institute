import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Department, Course } from "@/utils/mockData";
import { Plus, Search, Trash } from "lucide-react";

interface Instructor {
  id: string;
  name: string;
  nationalId: string;
  specialization: string;
  qualifications: string;
  departmentId: string;
  paymentMethod: "amount" | "percentage" | "monthly";
  paymentAmount: number;
  courseIds: string[];
}

const Instructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [formData, setFormData] = useState<Partial<Instructor>>({
    name: "",
    nationalId: "",
    specialization: "",
    qualifications: "",
    departmentId: "",
    paymentMethod: "amount",
    paymentAmount: 0,
    courseIds: [],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let stored = getFromLocalStorage<Instructor[]>("latin_academy_instructors", undefined);
    if (!stored) {
      stored = [];
      saveToLocalStorage("latin_academy_instructors", stored);
    }
    setInstructors(stored);
    setDepartments(getFromLocalStorage<Department[]>("latin_academy_departments", []));
    setCourses(getFromLocalStorage<Course[]>("latin_academy_courses", []));
  }, []);

  const filteredInstructors = instructors.filter((ins) => {
    const matchesName = ins.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter && departmentFilter !== "all" ? ins.departmentId === departmentFilter : true;
    return matchesName && matchesDept;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleMultiSelectChange = (selected: string[]) => {
    setFormData({ ...formData, courseIds: selected });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nationalId || !formData.departmentId || !formData.paymentMethod) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    const newInstructor: Instructor = {
      id: generateId("instructor-"),
      name: formData.name!,
      nationalId: formData.nationalId!,
      specialization: formData.specialization || "",
      qualifications: formData.qualifications || "",
      departmentId: formData.departmentId!,
      paymentMethod: formData.paymentMethod!,
      paymentAmount: formData.paymentAmount || 0,
      courseIds: formData.courseIds || [],
    };
    const updated = [...instructors, newInstructor];
    setInstructors(updated);
    saveToLocalStorage("latin_academy_instructors", updated);
    setFormData({
      name: "",
      nationalId: "",
      specialization: "",
      qualifications: "",
      departmentId: "",
      paymentMethod: "amount",
      paymentAmount: 0,
      courseIds: [],
    });
    setIsDialogOpen(false);
    toast({ title: "تم بنجاح", description: "تم إضافة المحاضر بنجاح" });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">إدارة المحاضرين</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن محاضر..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصفية بالقسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام</SelectItem>
              {departments.filter(d => d.id && d.id !== "").map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="h-4 w-4 ml-2" />
                إضافة محاضر
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة محاضر جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المحاضر بالكامل.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم المحاضر *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">الرقم القومي *</Label>
                    <Input id="nationalId" name="nationalId" value={formData.nationalId} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">التخصص</Label>
                    <Input id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">المؤهلات</Label>
                    <Input id="qualifications" name="qualifications" value={formData.qualifications} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">القسم *</Label>
                    <Select name="departmentId" value={formData.departmentId} onValueChange={(v) => handleSelectChange("departmentId", v)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">طريقة الحساب *</Label>
                    <Select name="paymentMethod" value={formData.paymentMethod} onValueChange={(v) => handleSelectChange("paymentMethod", v)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الحساب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">مبلغ ثابت</SelectItem>
                        <SelectItem value="percentage">نسبة</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">مبلغ الحساب *</Label>
                    <Input id="paymentAmount" name="paymentAmount" type="number" value={formData.paymentAmount} onChange={handleChange} required min={0} />
                  </div>
                  <div className="space-y-2">
                    <Label>الكورسات التي يدرسها</Label>
                    <div className="flex flex-wrap gap-2">
                      {courses.map((c) => (
                        <label key={c.id} className="flex items-center gap-1 text-xs border rounded px-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.courseIds?.includes(c.id) || false}
                            onChange={e => {
                              const selected = new Set(formData.courseIds || []);
                              if (e.target.checked) selected.add(c.id);
                              else selected.delete(c.id);
                              handleMultiSelectChange(Array.from(selected));
                            }}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit">حفظ</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {filteredInstructors.length > 0 ? (
        <div className="space-y-6">
          {filteredInstructors.map((ins) => (
            <Card key={ins.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CardTitle>{ins.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <div className="text-xs flex items-center"><span className="font-medium ml-1">القسم:</span> {departments.find(d => d.id === ins.departmentId)?.name || "غير معروف"}</div>
                    <div className="text-xs flex items-center"><span className="font-medium ml-1">الرقم القومي:</span> {ins.nationalId}</div>
                    <div className="text-xs flex items-center"><span className="font-medium ml-1">التخصص:</span> {ins.specialization}</div>
                    <div className="text-xs flex items-center"><span className="font-medium ml-1">المؤهلات:</span> {ins.qualifications}</div>
                    <div className="text-xs flex items-center"><span className="font-medium ml-1">طريقة الحساب:</span> {ins.paymentMethod === "amount" ? "مبلغ ثابت" : ins.paymentMethod === "percentage" ? "نسبة" : "شهري"}</div>
                    <div className="text-xs flex items-center"><span className="font-medium ml-1">مبلغ الحساب:</span> {ins.paymentAmount}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="font-semibold text-xs">الكورسات:</span>
                    {ins.courseIds.map(cid => (
                      <span key={cid} className="bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs">
                        {courses.find(c => c.id === cid)?.name || "-"}
                      </span>
                    ))}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-1">
                {/* تفاصيل إضافية هنا */}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10">لا يوجد محاضرين مسجلين</div>
      )}
    </div>
  );
};

export default Instructors;

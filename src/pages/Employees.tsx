
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Employee } from "@/utils/mockData";
import { BadgeCheck, Plus, Search, Trash } from "lucide-react";

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: "",
    birthDate: "",
    nationalId: "",
    qualification: "",
    status: "active",
    salary: 0,
    paymentMethod: "monthly",
    paymentAmount: 0,
    roleId: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage
  useEffect(() => {
    const storedEmployees = getFromLocalStorage<Employee[]>("latin_academy_employees", []);
    const storedRoles = getFromLocalStorage<any[]>("latin_academy_roles", []);
    
    setEmployees(storedEmployees);
    setRoles(storedRoles);
  }, []);

  // Handle search
  const filteredEmployees = employees.filter(
    (employee) => employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs
    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nationalId || !formData.roleId) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    // Create new employee
    const newEmployee: Employee = {
      id: generateId("emp-"),
      name: formData.name!,
      birthDate: formData.birthDate || "",
      nationalId: formData.nationalId!,
      qualification: formData.qualification || "",
      status: formData.status as "active" | "suspended" | "training" | "terminated",
      salary: formData.salary || 0,
      paymentMethod: formData.paymentMethod as "monthly" | "commission" | "percentage",
      paymentAmount: formData.paymentAmount || 0,
      roleId: formData.roleId!,
    };
    
    // Add to state and localStorage
    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    saveToLocalStorage("latin_academy_employees", updatedEmployees);
    
    // Reset form and close dialog
    setFormData({
      name: "",
      birthDate: "",
      nationalId: "",
      qualification: "",
      status: "active",
      salary: 0,
      paymentMethod: "monthly",
      paymentAmount: 0,
      roleId: "",
    });
    setIsDialogOpen(false);
    
    toast({
      title: "تم بنجاح",
      description: "تم إضافة الموظف بنجاح",
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    const updatedEmployees = employees.filter((employee) => employee.id !== id);
    setEmployees(updatedEmployees);
    saveToLocalStorage("latin_academy_employees", updatedEmployees);
    
    toast({
      title: "تم بنجاح",
      description: "تم حذف الموظف بنجاح",
    });
  };

  // Get role name by ID
  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role?.name || "غير معروف";
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">إدارة الموظفين</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن موظف..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="h-4 w-4 ml-2" />
                إضافة موظف
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الموظف الجديد. اضغط حفظ عند الانتهاء.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">اسم الموظف *</Label>
                      <Input 
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalId">الرقم القومي *</Label>
                      <Input 
                        id="nationalId"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">تاريخ الميلاد</Label>
                      <Input 
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualification">المؤهل</Label>
                      <Input 
                        id="qualification"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">الحالة</Label>
                      <Select 
                        name="status"
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة الموظف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">يعمل</SelectItem>
                          <SelectItem value="suspended">موقوف</SelectItem>
                          <SelectItem value="training">تدريب</SelectItem>
                          <SelectItem value="terminated">منتهي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleId">الدور *</Label>
                      <Select 
                        name="roleId"
                        value={formData.roleId}
                        onValueChange={(value) => handleSelectChange("roleId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر دور الموظف" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">طريقة الحساب</Label>
                      <Select 
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">شهري</SelectItem>
                          <SelectItem value="commission">عمولة</SelectItem>
                          <SelectItem value="percentage">نسبة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">المرتب</Label>
                      <Input 
                        id="salary"
                        name="salary"
                        type="number"
                        value={formData.salary?.toString()}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">قيمة الحساب</Label>
                      <Input 
                        id="paymentAmount"
                        name="paymentAmount"
                        type="number"
                        value={formData.paymentAmount?.toString()}
                        onChange={handleChange}
                      />
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
                  <Button type="submit">حفظ</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
          <CardDescription>
            إدارة بيانات الموظفين وأدوارهم في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرقم القومي</TableHead>
                    <TableHead>المؤهل</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.nationalId}</TableCell>
                      <TableCell>{employee.qualification}</TableCell>
                      <TableCell>{getRoleName(employee.roleId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="h-4 w-4 text-green-500" />
                          <span>
                            {employee.status === "active" ? "يعمل" : 
                             employee.status === "suspended" ? "موقوف" : 
                             employee.status === "training" ? "تدريب" : "منتهي"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              لم يتم العثور على موظفين. قم بإضافة موظفين جدد.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;

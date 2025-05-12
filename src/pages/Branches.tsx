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
import { Plus, Search, Trash, Loader2, Pencil } from "lucide-react";
import { getAll, create, deleteById, edit } from "@/api/coreApi";
import { BrancheGetByIdType, BrancheCreateType } from "@/api/coreTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Branches = () => {
  const [branches, setBranches] = useState<BrancheGetByIdType[]>([]);
  const [areas, setAreas] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<BrancheCreateType>>({
    name: "",
    address: "",
    areaId: 0
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editBranchId, setEditBranchId] = useState<number | null>(null);
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
      // جلب الفروع والمناطق بالتوازي
      const [branchesData, areasData] = await Promise.all([
        getAll<BrancheGetByIdType[]>("Branches/pagination"),
        getAll<{id: number, name: string}[]>("Areaes/pagination")
      ]);
      
      console.log("API Response - Branches:", branchesData);
      console.log("API Response - Areas:", areasData);
      
      // استخراج البيانات من الاستجابة
      const extractData = (response: any) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.data && Array.isArray(response.data)) return response.data;
        if (response.items && Array.isArray(response.items)) return response.items;
        if (response.results && Array.isArray(response.results)) return response.results;
        return [];
      };
      
      setBranches(extractData(branchesData));
      setAreas(extractData(areasData));
    } catch (err) {
      console.error("Error fetching branches data:", err);
      setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
  
  // تنفيذ استدعاء البيانات عند تحميل الصفحة أو عند تغيير refreshTrigger
  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  // معالجة البحث
  const filteredBranches = branches.filter(
    (branch) => 
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.id?.toString().includes(searchTerm)
  );

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // معالجة تقديم النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.areaId) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && editBranchId) {
        // تعديل فرع موجود
        const branchData = {
          id: editBranchId,
          name: formData.name,
          address: formData.address || "",
          areaId: Number(formData.areaId)
        };
        
        console.log("Updating branch:", branchData);
        
        const updatedBranch = await edit<BrancheGetByIdType>("Branches", editBranchId, branchData);
        console.log("API Response - Updated Branch:", updatedBranch);
        
        // تحديث الفرع في الحالة
        const updatedBranches = branches.map(branch => 
          branch.id === editBranchId ? {...branch, ...updatedBranch} : branch
        );
        setBranches(updatedBranches);
        
        toast({
          title: "تم بنجاح",
          description: "تم تعديل الفرع بنجاح",
        });
      } else {
        // إنشاء فرع جديد باستخدام API
        const branchData: BrancheCreateType = {
          name: formData.name,
          address: formData.address || "",
          areaId: Number(formData.areaId)
        };
        
        console.log("Creating new branch:", branchData);
        
        const newBranch = await create<BrancheGetByIdType>("Branches", branchData);
        console.log("API Response - New Branch:", newBranch);
        
        // إضافة الفرع الجديد إلى الحالة
        setBranches([...branches, newBranch]);
        
        toast({
          title: "تم بنجاح",
          description: "تم إضافة الفرع بنجاح",
        });
      }
      
      // إعادة تعيين النموذج وإغلاق الحوار وتحديث البيانات
      resetForm();
      setIsDialogOpen(false);
      // تحديث البيانات بعد الإضافة أو التعديل
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Error with branch operation:", error);
      toast({
        title: "خطأ في العملية",
        description: isEditMode 
          ? "حدث خطأ أثناء محاولة تعديل الفرع. يرجى المحاولة مرة أخرى."
          : "حدث خطأ أثناء محاولة إضافة الفرع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      areaId: 0
    });
    setIsEditMode(false);
    setEditBranchId(null);
  };
  
  // تحميل بيانات الفرع للتعديل
  const handleEdit = (branch: BrancheGetByIdType) => {
    setFormData({
      name: branch.name,
      address: branch.address || "",
      areaId: branch.areaId
    });
    setEditBranchId(branch.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // معالجة الحذف
  const handleDelete = async (id: number) => {
    try {
      // حذف الفرع باستخدام API
      await deleteById("Branches", id);
      
      // تحديث البيانات بعد الحذف
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفرع بنجاح",
      });
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء محاولة حذف الفرع. يرجى المحاولة مرة أخرى.",
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

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">إدارة الفروع</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن فرع..."
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
                إضافة فرع
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'تعديل بيانات الفرع' : 'أدخل بيانات الفرع الجديد.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الفرع *</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="مثال: الفرع الرئيسي - المعادي"
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
                      placeholder="مثال: شارع 9 - المعادي"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="areaId">المنطقة *</Label>
                    <Select 
                      name="areaId"
                      value={formData.areaId?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("areaId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id.toString()}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
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

      <Card>
        <CardHeader>
          <CardTitle>الفروع</CardTitle>
          <CardDescription>
            قائمة بجميع فروع الأكاديمية وعناوينها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBranches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد فروع مضافة حالياً
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المنطقة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.id}</TableCell>
                    <TableCell>{branch.name}</TableCell>
                    <TableCell>{branch.address || "غير محدد"}</TableCell>
                    <TableCell>{branch.areaName || "غير محدد"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(branch)}
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(branch.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الفرع نهائياً. لا يمكن التراجع عن هذا الإجراء.
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

export default Branches;

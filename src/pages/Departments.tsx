
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
import { useToast } from "@/components/ui/use-toast";
import { getAll, create, deleteById, edit } from "@/api/coreApi";
import { CategoryGetByIdType, CategoryCreateType, CategoryEditType } from "@/api/coreTypes";
import { FolderOpen, Plus, Search, Trash, Loader2, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";

const Departments = () => {
  const [departments, setDepartments] = useState<CategoryGetByIdType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CategoryCreateType>({
    name: "",
    description: ""
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);
  const [deleteDepartmentId, setDeleteDepartmentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const translations = {
    ar: {
      title: "الأقسام",
      pageDescription: "إدارة أقسام الأكاديمية والتخصصات المختلفة",
      addDepartment: "إضافة قسم",
      editDepartment: "تعديل القسم",
      deleteDepartment: "حذف القسم",
      deleteConfirm: "هل أنت متأكد من حذف هذا القسم؟",
      deleteWarning: "هذا الإجراء لا يمكن التراجع عنه.",
      search: "بحث...",
      name: "الاسم",
      description: "الوصف",
      actions: "الإجراءات",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      loading: "جاري التحميل...",
      noData: "لا توجد أقسام",
      departmentNameRequired: "اسم القسم مطلوب",
      departmentAddSuccess: "تم إضافة القسم بنجاح",
      departmentEditSuccess: "تم تعديل القسم بنجاح",
      departmentDeleteSuccess: "تم حذف القسم بنجاح",
      error: "حدث خطأ"
    },
    en: {
      title: "Departments",
      pageDescription: "Manage academy departments and specializations",
      addDepartment: "Add Department",
      editDepartment: "Edit Department",
      deleteDepartment: "Delete Department",
      deleteConfirm: "Are you sure you want to delete this department?",
      deleteWarning: "This action cannot be undone.",
      search: "Search...",
      name: "Name",
      description: "Description",
      actions: "Actions",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      loading: "Loading...",
      noData: "No departments found",
      departmentNameRequired: "Department name is required",
      departmentAddSuccess: "Department added successfully",
      departmentEditSuccess: "Department updated successfully",
      departmentDeleteSuccess: "Department deleted successfully",
      error: "An error occurred"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Define possible response types
  type ApiResponse = 
    | CategoryGetByIdType[] 
    | { data: CategoryGetByIdType[] } 
    | { items: CategoryGetByIdType[] } 
    | { results: CategoryGetByIdType[] }
    | Record<string, any>;

  const extractData = (response: ApiResponse): CategoryGetByIdType[] => {
    if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object') {
      if ('data' in response && Array.isArray(response.data)) {
        return response.data;
      } else if ('items' in response && Array.isArray(response.items)) {
        return response.items;
      } else if ('results' in response && Array.isArray(response.results)) {
        return response.results;
      }
    }
    return [];
  };

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAll<ApiResponse>("Categories/pagination");
      console.log("Departments data:", response);
      
      // Extract the departments array from the response
      const departmentsData = extractData(response);
      
      console.log("Extracted departments data:", departmentsData);
      setDepartments(departmentsData);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const filteredDepartments = departments.filter(
    (department) => 
      department.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddDepartment = async () => {
    if (!formData.name) {
      toast({
        title: t.departmentNameRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const departmentData: CategoryCreateType = {
        name: formData.name,
        description: formData.description || ""
      };
      
      console.log("Creating department:", departmentData);
      
      const newDepartment = await create<CategoryGetByIdType>("Categories", departmentData);
      console.log("API Response - New Department:", newDepartment);
      
      // Refresh the departments data
      await fetchDepartments();
      setIsAddDialogOpen(false);
      setFormData({ name: "", description: "" });
      
      toast({
        title: t.departmentAddSuccess,
      });
    } catch (err) {
      console.error("Error adding department:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!formData.name || !editDepartmentId) {
      toast({
        title: t.departmentNameRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const departmentData: CategoryEditType = {
        id: editDepartmentId,
        name: formData.name,
        description: formData.description
      };
      
      console.log("Updating department:", departmentData);
      
      const updatedDepartment = await edit<CategoryGetByIdType>("Categories", editDepartmentId, departmentData);
      console.log("API Response - Updated Department:", updatedDepartment);
      
      // Refresh the departments data
      await fetchDepartments();
      setIsEditDialogOpen(false);
      setFormData({ name: "", description: "" });
      setEditDepartmentId(null);
      
      toast({
        title: t.departmentEditSuccess,
      });
    } catch (err) {
      console.error("Error updating department:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDepartmentId) return;

    setIsSubmitting(true);
    try {
      await deleteById("Categories", deleteDepartmentId);
      
      // Refresh the departments data
      await fetchDepartments();
      setIsDeleteDialogOpen(false);
      setDeleteDepartmentId(null);
      
      toast({
        title: t.departmentDeleteSuccess,
      });
    } catch (err) {
      console.error("Error deleting department:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (department: CategoryGetByIdType) => {
    setFormData({
      name: department.name || "",
      description: department.description || ""
    });
    setEditDepartmentId(department.id);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (departmentId: number) => {
    setDeleteDepartmentId(departmentId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.pageDescription}</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addDepartment}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.addDepartment}</DialogTitle>
                  <DialogDescription>{t.pageDescription}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      {t.name}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      {t.description}
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleAddDepartment} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.loading}
                      </>
                    ) : (
                      t.save
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.description}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-primary" />
                          <span>{department.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{department.description}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(department)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(department.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editDepartment}</DialogTitle>
            <DialogDescription>{t.pageDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                {t.name}
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                {t.description}
              </Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleEditDepartment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.save
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDepartment}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirm} {t.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Departments;

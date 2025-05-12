
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
import { getAll, create, deleteById, edit } from "@/api/coreApi";
import { CategoryGetByIdType, CategoryCreateType, CategoryEditType ,RoomCreateType} from "@/api/coreTypes";
import { Textarea } from "@/components/ui/textarea";
import { Laptop, Monitor, Users, MapPin, Plus, Search, Trash, Loader2, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";

// Extend the CategoryType to include room-specific fields
interface type extends CategoryGetByIdType {
  type?: string;
  capacity?: number;
  branchId?: number;
  branchName?: string;
}

interface RoomCreateType extends CategoryCreateType {
  type?: string;
  capacity?: number;
  branchId?: number;
  branchName?: string;
}

interface RoomEditType extends CategoryEditType {
  type?: string;
  capacity?: number;
  branchId?: number;
  branchName?: string;
}

const Labs = () => {
  const [categories, setCategories] = useState<type[]>([]);
  const [branches, setBranches] = useState<{id: number, name: string}[]>([]);
  const [types, settypes] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState<RoomCreateType>({
    name: "",
    type: "lab", // Default to lab
    capacity: 0,
    branchId: 0,
    branchName: ""
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const translations = {
    ar: {
      title: "المعامل والقاعات",
      pageDescription: "إدارة المعامل والقاعات في النظام",
      addCategory: "إضافة معمل/قاعة",
      editCategory: "تعديل المعمل/القاعة",
      deleteCategory: "حذف المعمل/القاعة",
      deleteConfirm: "هل أنت متأكد من حذف هذا المعمل/القاعة؟",
      deleteWarning: "هذا الإجراء لا يمكن التراجع عنه.",
      search: "بحث...",
      name: "الاسم",
      description: "الوصف",
      type: "النوع",
      capacity: "السعة",
      equipment: "التجهيزات",
      branchName: "الموقع",
      branchId: "الفرع",
      lab: "معمل",
      hall: "قاعة",
      actions: "الإجراءات",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      loading: "جاري التحميل...",
      noData: "لا توجد معامل أو قاعات",
      categoryNameRequired: "اسم المعمل/القاعة مطلوب",
      categoryAddSuccess: "تم إضافة المعمل/القاعة بنجاح",
      categoryEditSuccess: "تم تعديل المعمل/القاعة بنجاح",
      categoryDeleteSuccess: "تم حذف المعمل/القاعة بنجاح",
      error: "حدث خطأ"
    },
    en: {
      title: "Labs & Halls",
      pageDescription: "Manage labs and halls in the system",
      addCategory: "Add Lab/Hall",
      editCategory: "Edit Lab/Hall",
      deleteCategory: "Delete Lab/Hall",
      deleteConfirm: "Are you sure you want to delete this lab/hall?",
      deleteWarning: "This action cannot be undone.",
      search: "Search...",
      name: "Name",
      description: "Description",
      type: "Type",
      capacity: "Capacity",
      equipment: "Equipment",
      branchId: "Branch",
      branchName: "branchName",
      lab: "Lab",
      hall: "Hall",
      actions: "Actions",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      loading: "Loading...",
      noData: "No labs or halls found",
      categoryNameRequired: "Lab/hall name is required",
      categoryAddSuccess: "Lab/hall added successfully",
      categoryEditSuccess: "Lab/hall updated successfully",
      categoryDeleteSuccess: "Lab/hall deleted successfully",
      error: "An error occurred"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchCategories();
    fetchBranches();
    fetchtypes();
  }, [refreshTrigger]);

  // Define possible response types
  type ApiResponse = 
    | type[] 
    | { data: type[] } 
    | { items: type[] } 
    | { results: type[] }
    | Record<string, any>;

  const extractData = (response: ApiResponse): type[] => {
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

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAll<ApiResponse>("Rooms/pagination");
      console.log("Labs/Halls data:", response);
      
      // Extract the categories array from the response
      const categoriesData = extractData(response);
      
      console.log("Extracted labs/halls data:", categoriesData);
      
      // Ensure we have room types before setting categories
      await fetchtypes();
      
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching labs/halls:", err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await getAll<any>("Branches/pagination");
      console.log("Branches data:", response);
      
      // Extract the branches array from the response
      const branchesData = extractData(response);
      
      console.log("Extracted branches data:", branchesData);
      setBranches(branchesData);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchtypes = async () => {
    try {
      // Use a direct API call to get room types
      const response = await getAll<any>("HelpTables/RoomType");
      console.log("Room Types data:", response);
      
      // Extract the room types array from the response
      let typesData = extractData(response);
      
      // If no data was returned, use hardcoded values as fallback
      if (!typesData || typesData.length === 0) {
        typesData = [
          { id: 1, name: t.lab },
          { id: 2, name: t.hall }
        ];
      }
      
      console.log("Extracted room types data:", typesData);
      
      // Transform the data to match the expected format
      const formattedtypes = typesData.map((type: any) => ({
        id: type.id || 0,
        name: type.name || ''
      }));
      
      console.log("Formatted room types:", formattedtypes);
      settypes(formattedtypes);
      
      return formattedtypes;
    } catch (err) {
      console.error("Error fetching room types:", err);
      
      // Use hardcoded values as fallback if API fails
      const fallbackTypes = [
        { id: 1, name: t.lab },
        { id: 2, name: t.hall }
      ];
      
      settypes(fallbackTypes);
      return fallbackTypes;
    }
  };

  // Get room type name from its ID
  const gettypeName = (typeId: string | undefined): string => {
    if (!typeId) return '-';
    
    // Try to find in our room types list
    const type = types.find(type => 
      type.id.toString() === typeId
    );
    
    if (type) {
      return type.name;
    }
    
    // Check for common types
    if (typeId === 'lab') return t.lab;
    if (typeId === 'hall') return t.hall;
    
    // If all else fails, just return the ID
    return typeId;
  };

  // Handle search
  const filteredCategories = categories.filter(
    (category) => 
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.id?.toString().includes(searchTerm)
  );

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddCategory = async () => {
    if (!formData.name) {
      toast({
        title: t.categoryNameRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const roomData: RoomCreateType = {
        name: formData.name,
        description: "", // Empty description
        type: formData.type || "",
        capacity: formData.capacity || 0,
        branchId: formData.branchId || 0,
        branchName: formData.branchName || ""
      };
      
      console.log("Creating lab/hall:", roomData);
      
      const newRoom = await create<RoomCreateType>("Rooms", roomData);
      console.log("API Response - New Lab/Hall:", newRoom);
      
      // Refresh the categories data
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        type: "lab",
        capacity: 0,
        branchId: 0,
        branchName: ""
      });
      // Trigger a refresh of the data
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: t.categoryAddSuccess,
      });
    } catch (err) {
      console.error("Error adding lab/hall:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!formData.name || !editCategoryId) {
      toast({
        title: t.categoryNameRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const roomData: RoomEditType = {
        id: editCategoryId,
        name: formData.name,
        description: "", // Empty description
        type: formData.type,
        capacity: formData.capacity,
        branchId: formData.branchId,
        branchName: formData.branchName
      };
      
      console.log("Updating lab/hall:", roomData);
      
      const updatedRoom = await edit<type>("Rooms", editCategoryId, roomData);
      console.log("API Response - Updated Lab/Hall:", updatedRoom);
      
      // Refresh the categories data
      setIsEditDialogOpen(false);
      setFormData({
        name: "",
        type: "",
        capacity: 0,
        branchId: 0,
        branchName: ""
      });
      setEditCategoryId(null);
      // Trigger a refresh of the data
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: t.categoryEditSuccess,
      });
    } catch (err) {
      console.error("Error updating lab/hall:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;

    setIsSubmitting(true);
    try {
      await deleteById("Rooms", deleteCategoryId);
      
      // Refresh the categories data
      setIsDeleteDialogOpen(false);
      setDeleteCategoryId(null);
      // Trigger a refresh of the data
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: t.categoryDeleteSuccess,
      });
    } catch (err) {
      console.error("Error deleting lab/hall:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (room: type) => {
    setFormData({
      name: room.name || "",
      type: room.type || "",
      capacity: room.capacity || 0,
      branchId: room.branchId || 0,
      branchName: room.branchName || ""
    });
    setEditCategoryId(room.id);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (categoryId: number) => {
    setDeleteCategoryId(categoryId);
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
                  {t.addCategory}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.addCategory}</DialogTitle>
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
                    <Label htmlFor="type" className="text-right">
                      {t.type}
                    </Label>
                    <Select
                      value={formData.type || ""}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t.type} />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capacity" className="text-right">
                      {t.capacity}
                    </Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      value={formData.capacity || 0}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="branchId" className="text-right">
                      {t.branchId}
                    </Label>
                    <Select
                      value={formData.branchId?.toString() || ""}
                      onValueChange={(value) => {
                        const branchId = parseInt(value);
                        const selectedBranch = branches.find(b => b.id === branchId);
                        setFormData({ 
                          ...formData, 
                          branchId: branchId,
                          branchName: selectedBranch?.name || ""
                        });
                      }}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t.branchId} />
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleAddCategory} disabled={isSubmitting}>
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
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.capacity}</TableHead>
                  <TableHead>{t.branchName}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-muted-foreground">{room.description}</div>
                      </TableCell>
                      <TableCell>
                        {gettypeName(room.type)}
                      </TableCell>
                      <TableCell>{room.capacity || 0}</TableCell>
                      <TableCell>{room.branchName || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(room.id)}
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
            <DialogTitle>{t.editCategory}</DialogTitle>
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
              <Label htmlFor="edit-type" className="text-right">
                {t.type}
              </Label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t.type} />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-capacity" className="text-right">
                {t.capacity}
              </Label>
              <Input
                id="edit-capacity"
                name="capacity"
                type="number"
                value={formData.capacity || 0}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-branchId" className="text-right">
                {t.branchId}
              </Label>
              <Select
                value={formData.branchId?.toString() || ""}
                onValueChange={(value) => {
                  const branchId = parseInt(value);
                  const selectedBranch = branches.find(b => b.id === branchId);
                  setFormData({ 
                    ...formData, 
                    branchId: branchId,
                    branchName: selectedBranch?.name || ""
                  });
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t.branchId} />
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

            <div className="grid grid-cols-4 items-start gap-4" style={{display: 'none'}}>
              <Label htmlFor="edit-description" className="text-right pt-2">
                {t.description}
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
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
            <AlertDialogTitle>{t.deleteCategory}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirm} {t.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} disabled={isSubmitting}>
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

export default Labs;

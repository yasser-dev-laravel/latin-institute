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
import { Plus, Search, Trash, Loader2, Pencil } from "lucide-react";
import { getAll, create, deleteById, edit } from "@/api/coreApi";
import { CityGetByIdType, CityCreateType } from "@/api/coreTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";

const Cities = () => {
  const [cities, setCities] = useState<CityGetByIdType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CityCreateType>({
    name: ""
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editCityId, setEditCityId] = useState<number | null>(null);
  const [deleteCityId, setDeleteCityId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const translations = {
    ar: {
      title: "المدن",
      description: "إدارة المدن في النظام",
      addCity: "إضافة مدينة",
      editCity: "تعديل المدينة",
      deleteCity: "حذف المدينة",
      deleteConfirm: "هل أنت متأكد من حذف هذه المدينة؟",
      deleteWarning: "هذا الإجراء لا يمكن التراجع عنه.",
      search: "بحث...",
      name: "الاسم",
      actions: "الإجراءات",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      loading: "جاري التحميل...",
      noData: "لا توجد مدن",
      cityNameRequired: "اسم المدينة مطلوب",
      cityAddSuccess: "تم إضافة المدينة بنجاح",
      cityEditSuccess: "تم تعديل المدينة بنجاح",
      cityDeleteSuccess: "تم حذف المدينة بنجاح",
      error: "حدث خطأ"
    },
    en: {
      title: "Cities",
      description: "Manage cities in the system",
      addCity: "Add City",
      editCity: "Edit City",
      deleteCity: "Delete City",
      deleteConfirm: "Are you sure you want to delete this city?",
      deleteWarning: "This action cannot be undone.",
      search: "Search...",
      name: "Name",
      actions: "Actions",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      loading: "Loading...",
      noData: "No cities found",
      cityNameRequired: "City name is required",
      cityAddSuccess: "City added successfully",
      cityEditSuccess: "City updated successfully",
      cityDeleteSuccess: "City deleted successfully",
      error: "An error occurred"
    }
  };

  const t = translations[language];

  useEffect(() => {
    fetchCities();
  }, []);

  // Define possible response types
  type ApiResponse = 
    | CityGetByIdType[] 
    | { data: CityGetByIdType[] } 
    | { items: CityGetByIdType[] } 
    | { results: CityGetByIdType[] }
    | Record<string, any>;

  const extractData = (response: ApiResponse): CityGetByIdType[] => {
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

  const fetchCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAll<ApiResponse>("Cityes/pagination");
      console.log("Cities data:", response);
      
      // Extract the cities array from the response
      const citiesData = extractData(response);
      
      console.log("Extracted cities data:", citiesData);
      setCities(citiesData);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async () => {
    if (!formData.name) {
      toast({
        title: t.cityNameRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cityData: CityCreateType = {
        name: formData.name
      };
      
      console.log("Creating city:", cityData);
      
      const newCity = await create<CityGetByIdType>("Cityes", cityData);
      console.log("API Response - New City:", newCity);
      
      // Refresh the cities data instead of just adding to the state
      await fetchCities();
      setIsAddDialogOpen(false);
      setFormData({ name: "" });
      
      toast({
        title: t.cityAddSuccess,
      });
    } catch (err) {
      console.error("Error adding city:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCity = async () => {
    if (!formData.name || !editCityId) {
      toast({
        title: t.cityNameRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const cityData = {
        id: editCityId,
        name: formData.name
      };
      
      console.log("Updating city:", cityData);
      
      const updatedCity = await edit<CityGetByIdType>("Cityes", editCityId, cityData);
      console.log("API Response - Updated City:", updatedCity);
      
      // Refresh the cities data instead of updating in state
      await fetchCities();
      setIsEditDialogOpen(false);
      setFormData({ name: "" });
      setEditCityId(null);
      
      toast({
        title: t.cityEditSuccess,
      });
    } catch (err) {
      console.error("Error updating city:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCity = async () => {
    if (!deleteCityId) return;

    setIsSubmitting(true);
    try {
      await deleteById("Cityes", deleteCityId);
      
      // Refresh the cities data instead of removing from state
      await fetchCities();
      setIsDeleteDialogOpen(false);
      setDeleteCityId(null);
      
      toast({
        title: t.cityDeleteSuccess,
      });
    } catch (err) {
      console.error("Error deleting city:", err);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (city: CityGetByIdType) => {
    setFormData({
      name: city.name || ""
    });
    setEditCityId(city.id);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cityId: number) => {
    setDeleteCityId(cityId);
    setIsDeleteDialogOpen(true);
  };

  const filteredCities = cities.filter(city => 
    city.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addCity}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.addCity}</DialogTitle>
                  <DialogDescription>{t.description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      {t.name}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleAddCity} disabled={isSubmitting}>
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
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      {t.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell>{city.name}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(city)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(city.id)}
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
            <DialogTitle>{t.editCity}</DialogTitle>
            <DialogDescription>{t.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                {t.name}
              </Label>
              <Input
                id="edit-name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleEditCity} disabled={isSubmitting}>
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
            <AlertDialogTitle>{t.deleteCity}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirm} {t.deleteWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCity} disabled={isSubmitting}>
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

export default Cities;

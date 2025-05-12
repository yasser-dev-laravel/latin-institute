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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { parseLeadsExcel, ParsedLead } from "@/utils/xlsxParser";
import { Branch, Course } from "@/utils/mockData";
import { Plus, Search, Trash, Pencil, Upload } from "lucide-react";

interface Campaign {
  id: string;
  code: string;
  name: string;
  date: string;
  branchId: string;
  courseId: string;
  leads: Lead[];
}

interface Lead {
  id: string;
  name: string;
  mobile: string;
  campaignId: string;
  messages: LeadMessage[];
  notes: string[];
  converted: boolean;
}

interface LeadMessage {
  id: string;
  templateId: string;
  content: string;
  sentAt: string;
  response?: string;
}

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<Campaign>>({ name: "", branchId: "", courseId: "" });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [excelFile, setExcelFile] = useState<File|null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string|null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCampaigns(getFromLocalStorage<Campaign[]>("latin_academy_campaigns", []));
    setBranches(getFromLocalStorage<Branch[]>("latin_academy_branches", []));
    setCourses(getFromLocalStorage<Course[]>("latin_academy_courses", []));
  }, []);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // Excel parsing with xlsx
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setExcelFile(file || null);
    if (file) {
      try {
        const parsed: ParsedLead[] = await parseLeadsExcel(file);
        const leadsArr: Lead[] = parsed.map(l => ({
          id: generateId("lead-"),
          name: l.name,
          mobile: l.mobile,
          campaignId: "",
          messages: [],
          notes: [],
          converted: false,
        }));
        setLeads(leadsArr);
        e.target.value = "";
        toast({ title: "تم استيراد العملاء بنجاح", description: `عدد العملاء: ${leadsArr.length}` });
      } catch (err: any) {
        setLeads([]);
        e.target.value = "";
        toast({ title: "خطأ في الملف", description: err.toString(), variant: "destructive" });
      }
    }
  };

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.branchId || !formData.courseId) {
      toast({ title: "خطأ في البيانات", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const newCampaign: Campaign = {
      id: generateId("camp-"),
      code: `CMP${Date.now()}`,
      name: formData.name!,
      date: new Date().toISOString(),
      branchId: formData.branchId!,
      courseId: formData.courseId!,
      leads: leads.map(l => ({ ...l, campaignId: undefined })), // إزالة أي قيمة سابقة للحملات القديمة
    };
    const updated = [...campaigns, newCampaign];
    setCampaigns(updated);
    saveToLocalStorage("latin_academy_campaigns", updated);
    window.dispatchEvent(new Event("storage")); // تحديث فوري لصفحة العملاء
    setFormData({ name: "", branchId: "", courseId: "" });
    setLeads([]);
    setExcelFile(null);
    setIsDialogOpen(false);
    toast({ title: "تم إضافة الحملة" });
  };

  // تعديل أو حذف lead داخل جدول العملاء المستوردين
  const handleLeadEdit = (id: string, key: keyof Lead, value: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, [key]: value } : l));
  };
  const handleLeadDelete = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
  };

  // إرسال رسائل واتساب جاهزة لكل العملاء في الحملة
  const handleSendWhatsApp = (camp: Campaign) => {
    // استخدم قالب افتراضي أو أول قالب متاح
    const templates = getFromLocalStorage<any[]>("latin_academy_msg_templates", []);
    const course = courses.find(c => c.id === camp.courseId);
    const branch = branches.find(b => b.id === camp.branchId);
    const template = templates[0];
    if (!template) {
      toast({ title: "لا يوجد قالب رسالة!", description: "يرجى إضافة قالب رسالة أولاً.", variant: "destructive" });
      return;
    }
    // لكل عميل، جهز نص الرسالة مع استبدال المتغيرات
    const messages = camp.leads.map(lead => {
      let msg = template.body;
      msg = msg.replace(/\{branch\}/g, branch?.name || "");
      msg = msg.replace(/\{student\}/g, lead.name);
      msg = msg.replace(/\{course\}/g, course?.name || "");
      return { mobile: lead.mobile, text: msg };
    });
    // جهز رابط واتساب ويب جماعي
    const waLinks = messages.map(m => `https://wa.me/${m.mobile}?text=${encodeURIComponent(m.text)}`);
    // افتح أول رابط فقط (المستخدم يرسل يدويًا أو ينسخ الباقي)
    if (waLinks.length > 0) {
      window.open(waLinks[0], "_blank");
      toast({ title: "تم تجهيز الرسالة الأولى في واتساب!", description: "أرسلها ثم كرر للعملاء الآخرين." });
    }
    // يمكن لاحقًا عرض جميع الروابط أو نسخها دفعة واحدة
  };

  // حذف حملة مع تأكيد
  const handleDeleteCampaign = (id: string) => {
    setDeleteDialogOpen(true);
    setCampaignToDelete(id);
  };
  const confirmDeleteCampaign = () => {
    if (!campaignToDelete) return;
    const updated = campaigns.filter(c => c.id !== campaignToDelete);
    setCampaigns(updated);
    saveToLocalStorage("latin_academy_campaigns", updated);
    window.dispatchEvent(new Event("storage"));
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
    toast({ title: "تم حذف الحملة بنجاح" });
  };

  // إضافة عميل جديد مؤقت قبل الحفظ
  const handleAddTempLead = () => {
    setLeads([
      ...leads,
      {
        id: generateId("lead-"),
        name: "",
        mobile: "",
        campaignId: "",
        messages: [],
        notes: [],
        converted: false,
      }
    ]);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">إدارة الحملات</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن حملة..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="h-4 w-4 ml-2" />
                إضافة حملة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة حملة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الحملة وارفع ملف إكسيل به العملاء (الاسم، الموبايل).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCampaign}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم الحملة *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">الفرع *</Label>
                    <Select value={formData.branchId || ""} onValueChange={v => handleSelectChange("branchId", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الفرع" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">الكورس *</Label>
                    <Select value={formData.courseId || ""} onValueChange={v => handleSelectChange("courseId", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الكورس" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ملف العملاء (إكسيل)</Label>
                    <Input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} />
                  </div>
                  {/* عرض جدول العملاء المستوردين والمضافين */}
                  {(leads.length > 0 || true) && (
                    <div className="space-y-2">
                      <Label>العملاء في الحملة</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الاسم</TableHead>
                            <TableHead>الموبايل</TableHead>
                            <TableHead>تعديل</TableHead>
                            <TableHead>حذف</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.map(lead => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <Input value={lead.name} onChange={e => handleLeadEdit(lead.id, "name", e.target.value)} className="w-32" />
                              </TableCell>
                              <TableCell>
                                <Input value={lead.mobile} onChange={e => handleLeadEdit(lead.id, "mobile", e.target.value)} className="w-32" />
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell><Button size="sm" variant="destructive" onClick={() => handleLeadDelete(lead.id)}><Trash className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button type="button" onClick={handleAddTempLead} variant="secondary" className="mt-2">إضافة عميل جديد</Button>
                    </div>
                  )}
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
      {/* قائمة الحملات */}
      {filteredCampaigns.length > 0 ? (
        <div className="space-y-6">
          {filteredCampaigns.map((camp) => (
            <Card key={camp.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CardTitle>{camp.name}</CardTitle>
                    <span className="text-xs text-gray-500">({camp.code})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCampaign(camp.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="text-xs text-gray-600 mt-1">الفرع: {branches.find(b => b.id === camp.branchId)?.name || "-"} | الكورس: {courses.find(c => c.id === camp.courseId)?.name || "-"}</div>
                  <div className="text-[10px] text-gray-400 mt-2">تاريخ الإنشاء: {new Date(camp.date).toLocaleString()}</div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-1">
                <Button size="sm" variant="default" onClick={() => handleSendWhatsApp(camp)}>
                  إرسال رسائل واتساب للعملاء
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10">لا يوجد حملات مسجلة</div>
      )}
      {/* حوار تأكيد حذف الحملة */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف الحملة</DialogTitle>
            <DialogDescription>هل أنت متأكد أنك تريد حذف هذه الحملة؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmDeleteCampaign}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;

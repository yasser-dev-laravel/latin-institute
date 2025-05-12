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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Branch, Course } from "@/utils/mockData";
import { Plus, Search, Trash, Pencil, ArrowRight } from "lucide-react";

interface LeadMessage {
  id: string;
  templateId: string;
  content: string;
  sentAt: string;
  response?: string;
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

interface Campaign {
  id: string;
  code: string;
  name: string;
  date: string;
  branchId: string;
  courseId: string;
  leads: Lead[];
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead|null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // جلب الحملات من localStorage
    let camps = getFromLocalStorage<Campaign[]>("latin_academy_campaigns", []);
    // إصلاح الحملات: إضافة leads فارغة إذا لم تكن موجودة
    let changed = false;
    camps = camps.map(c => {
      if (!Array.isArray(c.leads)) {
        changed = true;
        return { ...c, leads: [] };
      }
      return c;
    });
    if (changed) {
      saveToLocalStorage("latin_academy_campaigns", camps);
      console.log("تم إصلاح الحملات وإضافة leads فارغة حيث يلزم.");
    }
    console.log("الحملات من localStorage:", camps);
    setCampaigns(camps);
    setBranches(getFromLocalStorage<Branch[]>("latin_academy_branches", []));
    setCourses(getFromLocalStorage<Course[]>("latin_academy_courses", []));
    // جمع جميع العملاء من كل الحملات
    const allLeads: Lead[] = [];
    camps.forEach(c => c.leads.forEach(l => allLeads.push({ ...l, campaignId: c.id })));
    setLeads(allLeads);
    console.log("العملاء المجمعين:", allLeads);
  
    // تحديث تلقائي عند تغيير الحملات في localStorage
    const updateLeads = () => {
      const camps = getFromLocalStorage<Campaign[]>("latin_academy_campaigns", []);
      setCampaigns(camps);
      const allLeads: Lead[] = [];
      camps.forEach(c => c.leads.forEach(l => allLeads.push({ ...l, campaignId: c.id })));
      setLeads(allLeads);
    };
    window.addEventListener("storage", updateLeads);
    return () => window.removeEventListener("storage", updateLeads);
  }, []);

  // فلترة العملاء
  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.mobile.includes(searchTerm) ||
    (campaigns.find(c => c.id === l.campaignId)?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // إضافة ملاحظة
  const handleAddNote = () => {
    if (selectedLead && note.trim()) {
      const updated = leads.map(l => l.id === selectedLead.id ? { ...l, notes: [...l.notes, note] } : l);
      setLeads(updated);
      // تحديث في الحملات أيضًا
      const updatedCamps = campaigns.map(c => c.id === selectedLead.campaignId ? { ...c, leads: c.leads.map(l => l.id === selectedLead.id ? { ...l, notes: [...l.notes, note] } : l) } : c);
      setCampaigns(updatedCamps);
      saveToLocalStorage("latin_academy_campaigns", updatedCamps);
      setNote("");
      toast({ title: "تمت إضافة الملاحظة" });
    }
  };

  // تحويل لدارس
  const handleConvertToStudent = (lead: Lead) => {
    // حذف من الليدز وتحديث في الحملات
    const updatedLeads = leads.filter(l => l.id !== lead.id);
    setLeads(updatedLeads);
    const updatedCamps = campaigns.map(c => c.id === lead.campaignId ? { ...c, leads: c.leads.filter(l => l.id !== lead.id) } : c);
    setCampaigns(updatedCamps);
    saveToLocalStorage("latin_academy_campaigns", updatedCamps);
    // إضافة لقاعدة الدارسين (students)
    const students = getFromLocalStorage<any[]>("latin_academy_students", []);
    students.push({
      id: generateId("student-"),
      name: lead.name,
      mobile: lead.mobile,
      notes: lead.notes,
      // يمكن إضافة المزيد من البيانات لاحقًا
    });
    saveToLocalStorage("latin_academy_students", students);
    toast({ title: "تم تحويل العميل إلى دارس!", description: "يرجى إكمال بياناته في شاشة الدارسين." });
    // يمكن توجيه المستخدم تلقائيًا لشاشة الدارسين
    window.location.href = "/students";
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">العملاء المحتملين</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الموبايل أو الحملة..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>الموبايل</TableHead>
            <TableHead>اسم الحملة</TableHead>
            <TableHead>ملاحظات</TableHead>
            <TableHead>تحويل لدارس</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                لا يوجد عملاء محتملين بعد
              </TableCell>
            </TableRow>
          ) : filteredLeads.map(lead => (
            <TableRow key={lead.id}>
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.mobile}</TableCell>
              <TableCell>{campaigns.find(c => c.id === lead.campaignId)?.name || "-"}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>عرض/إضافة</Button>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="default" onClick={() => handleConvertToStudent(lead)}>
                  <ArrowRight className="h-4 w-4 ml-1" /> التحويل لدارس
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* حوار الملاحظات */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ملاحظات العميل: {selectedLead?.name}</DialogTitle>
            <DialogDescription>
              سجل جميع الملاحظات أو الردود الخاصة بهذا العميل.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedLead?.notes.map((n, i) => <div key={i} className="bg-gray-100 rounded p-2 text-sm">{n}</div>)}
          </div>
          <div className="flex gap-2 mt-2">
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="أضف ملاحظة جديدة..." />
            <Button onClick={handleAddNote}>حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;

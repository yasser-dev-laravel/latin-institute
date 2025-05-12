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
import { useToast } from "@/components/ui/use-toast";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Branch, Course } from "@/utils/mockData";
import { Plus, Search, Trash, Pencil } from "lucide-react";

interface MessageTemplate {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

const VARIABLE_LIST = [
  { key: "{branch}", label: "اسم الفرع" },
  { key: "{student}", label: "اسم الطالب" },
  { key: "{course}", label: "اسم الكورس" },
];

const Messaging = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<MessageTemplate>>({ title: "", body: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string|null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTemplates(getFromLocalStorage<MessageTemplate[]>("latin_academy_msg_templates", []));
  }, []);

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInsertVariable = (key: string) => {
    setFormData({ ...formData, body: (formData.body || "") + key });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast({ title: "خطأ في البيانات", description: "يرجى إدخال العنوان والنص", variant: "destructive" });
      return;
    }
    if (editTemplateId) {
      // تعديل قالب موجود
      const updated = templates.map(t => t.id === editTemplateId ? { ...t, ...formData } as MessageTemplate : t);
      setTemplates(updated);
      saveToLocalStorage("latin_academy_msg_templates", updated);
      toast({ title: "تم التعديل بنجاح" });
    } else {
      // إضافة قالب جديد
      const newTemplate: MessageTemplate = {
        id: generateId("msg-"),
        title: formData.title!,
        body: formData.body!,
        createdAt: new Date().toISOString(),
      };
      const updated = [...templates, newTemplate];
      setTemplates(updated);
      saveToLocalStorage("latin_academy_msg_templates", updated);
      toast({ title: "تم إضافة القالب" });
    }
    setFormData({ title: "", body: "" });
    setEditTemplateId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (template: MessageTemplate) => {
    setFormData({ title: template.title, body: template.body });
    setEditTemplateId(template.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveToLocalStorage("latin_academy_msg_templates", updated);
    toast({ title: "تم حذف القالب" });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4 md:mb-0">إدارة الرسائل</h2>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن رسالة أو نص..."
              className="pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="h-4 w-4 ml-2" />
                إضافة قالب
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editTemplateId ? "تعديل القالب" : "إضافة قالب جديد"}</DialogTitle>
                <DialogDescription>
                  يمكنك استخدام المتغيرات التالية: {VARIABLE_LIST.map(v => <span key={v.key} className="mx-1 text-blue-700">{v.key}</span>)}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">العنوان *</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">النص *</Label>
                    <textarea id="body" name="body" value={formData.body} onChange={handleChange} rows={5} className="w-full border rounded p-2 text-sm" required />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {VARIABLE_LIST.map(v => (
                      <Button type="button" key={v.key} size="sm" variant="outline" onClick={() => handleInsertVariable(v.key)}>
                        إدراج {v.label}
                      </Button>
                    ))}
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
      {filteredTemplates.length > 0 ? (
        <div className="space-y-6">
          {filteredTemplates.map((tpl) => (
            <Card key={tpl.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CardTitle>{tpl.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tpl)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tpl.id)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="text-xs text-gray-600 mt-1">{tpl.body}</div>
                  <div className="text-[10px] text-gray-400 mt-2">تاريخ الإنشاء: {new Date(tpl.createdAt).toLocaleString()}</div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-1">
                {/* يمكن إضافة زر إرسال هنا لاحقًا */}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10">لا يوجد قوالب رسائل مسجلة</div>
      )}
    </div>
  );
};

export default Messaging;

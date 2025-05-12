import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { getFromLocalStorage, saveToLocalStorage, generateId, generateCode } from "@/utils/localStorage";
import { Branch, Course, CourseLevel, Lab, Student } from "@/utils/mockData";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Instructor {
  id: string;
  name: string;
  courses: string[]; // course ids
}

const GROUP_STATUSES = [
  { value: "active", label: "نشطة" },
  { value: "pending", label: "انتظار" },
  { value: "postponed", label: "مؤجلة" },
  { value: "cancelled", label: "ملغية" },
  { value: "finished", label: "منتهية" }
];

// دالة اليوم بالعربية (مكررة محليًا لتجنب مشاكل الاستيراد)
function getArabicDayName(day: number) {
  return ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][day];
}

export default function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const navigate = useNavigate();

  // new group state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState<any>({
    name: "",
    code: "",
    courseId: "",
    levelId: "",
    branchId: "",
    labId: "",
    instructorId: "",
    weeklyDays: [],
    startTime: "",
    duration: "",
    status: "active",
    startDate: "",
    endDate: "",
    studentIds: [],
    price: 0 // أضفنا خاصية السعر الافتراضية
  });
  const [searchStudent, setSearchStudent] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; group: any | null }>({ open: false, group: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; group: any | null }>({ open: false, group: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; group: any | null }>({ open: false, group: null });
  const [editGroupData, setEditGroupData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setGroups(getFromLocalStorage<any[]>("latin_academy_groups", []));
    setCourses(getFromLocalStorage<Course[]>("latin_academy_courses", []));
    setBranches(getFromLocalStorage<Branch[]>("latin_academy_branches", []));
    setLabs(getFromLocalStorage<Lab[]>("latin_academy_labs", []));
    setInstructors(getFromLocalStorage<Instructor[]>("latin_academy_instructors", []));
    setStudents(getFromLocalStorage<Student[]>("latin_academy_students", []));
    setLevels(getFromLocalStorage<CourseLevel[]>("latin_academy_levels", []));
  }, []);

  useEffect(() => {
    // تصفية الطلاب حسب البحث
    if (searchStudent.trim() === "") setFilteredStudents(students);
    else {
      setFilteredStudents(students.filter(s =>
        s.name.includes(searchStudent) ||
        s.mobile.includes(searchStudent) ||
        (s.applicationNumber && s.applicationNumber.includes(searchStudent))
      ));
    }
  }, [searchStudent, students]);

  useEffect(() => {
    // حساب تاريخ النهاية بدقة حسب أيام المحاضرات وتاريخ البداية وعدد محاضرات المستوى
    if (newGroup.levelId && newGroup.startDate && newGroup.weeklyDays.length > 0) {
      const level = levels.find(l => l.id === newGroup.levelId);
      if (level) {
        const totalLectures = level.lectureCount;
        const weeklyDays = newGroup.weeklyDays;
        let lecturesLeft = totalLectures;
        let date = new Date(newGroup.startDate);
        // اجمع تواريخ المحاضرات الفعلية
        while (lecturesLeft > 0) {
          // إذا كان هذا اليوم من أيام المحاضرات
          if (weeklyDays.includes(["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][date.getDay()])) {
            lecturesLeft--;
          }
          if (lecturesLeft > 0) {
            date.setDate(date.getDate() + 1);
          }
        }
        setNewGroup((g: any) => ({ ...g, endDate: date.toISOString().slice(0, 10) }));
      }
    }
  }, [newGroup.levelId, newGroup.startDate, newGroup.weeklyDays, levels]);

  useEffect(() => {
    // عند تغيير المستوى يتم تعيين السعر تلقائياً من المستوى
    if (newGroup.levelId && levels.length > 0) {
      const level = levels.find(l => l.id === newGroup.levelId);
      if (level) {
        setNewGroup((g: any) => ({ ...g, price: level.price }));
      }
    }
  }, [newGroup.levelId, levels]);

  const handleAddGroup = () => {
    if (!newGroup.name || !newGroup.courseId || !newGroup.levelId || !newGroup.branchId || !newGroup.labId || !newGroup.instructorId || !newGroup.weeklyDays.length || !newGroup.startTime || !newGroup.duration || !newGroup.startDate || !newGroup.status) {
      alert("يرجى ملء جميع البيانات المطلوبة");
      return;
    }
    const code = generateCode("GRP", groups);
    // جلب عدد محاضرات المستوى
    const level = levels.find(l => l.id === newGroup.levelId);
    const lectureCount = level ? level.lectureCount : 0;
    const group = {
      ...newGroup,
      id: generateId("grp-"),
      code,
      studentIds: newGroup.studentIds,
      lectureCount, // أضف عدد محاضرات المجموعة تلقائياً من المستوى
      price: level ? level.price : newGroup.price // السعر من المستوى دائماً
    };
    const updated = [...groups, group];
    setGroups(updated);
    saveToLocalStorage("latin_academy_groups", updated);
    setDialogOpen(false);
    setNewGroup({
      name: "",
      code: "",
      courseId: "",
      levelId: "",
      branchId: "",
      labId: "",
      instructorId: "",
      weeklyDays: [],
      startTime: "",
      duration: "",
      status: "active",
      startDate: "",
      endDate: "",
      studentIds: [],
      price: 0 // إعادة تعيين السعر الافتراضي
    });
  };

  const handleStudentSelect = (id: string) => {
    setNewGroup((g: any) => ({ ...g, studentIds: g.studentIds.includes(id) ? g.studentIds.filter((sid: string) => sid !== id) : [...g.studentIds, id] }));
  };

  function handleShowDetails(group: any) {
    setDetailsDialog({ open: true, group });
  }
  function handleEditGroup(group: any) {
    setEditDialog({ open: true, group });
    setEditGroupData({ ...group });
  }
  function handleDeleteGroup(group: any) {
    setDeleteDialog({ open: true, group });
  }
  function confirmDeleteGroup() {
    if (deleteDialog.group) {
      setGroups(groups.filter(g => g.id !== deleteDialog.group.id));
      saveToLocalStorage("latin_academy_groups", groups.filter(g => g.id !== deleteDialog.group.id));
      toast({ title: "تم حذف المجموعة بنجاح" });
      setDeleteDialog({ open: false, group: null });
    }
  }
  function handleEditGroupSave() {
    if (editDialog.group) {
      const updatedGroups = groups.map(g => g.id === editDialog.group.id ? { ...editGroupData } : g);
      setGroups(updatedGroups);
      saveToLocalStorage("latin_academy_groups", updatedGroups);
      toast({ title: "تم تعديل بيانات المجموعة" });
      setEditDialog({ open: false, group: null });
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة المجموعات</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setDialogOpen(true)}>إضافة مجموعة جديدة</Button>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-[98vw] overflow-auto">
          <DialogHeader>
            <DialogTitle>إضافة مجموعة</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block mb-1 font-bold">اسم المجموعة</label>
              <Input placeholder="اسم المجموعة" value={newGroup.name} onChange={e => setNewGroup((g: any) => ({ ...g, name: e.target.value }))} />
            </div>
            <div>
              <label className="block mb-1 font-bold">الكورس</label>
              <Select value={newGroup.courseId} onValueChange={v => {
                setNewGroup((g: any) => ({ ...g, courseId: v, levelId: "", instructorId: "" }));
                const course = courses.find(c => c.id === v);
                setLevels(course?.levels || []);
                setInstructors(getFromLocalStorage<Instructor[]>("latin_academy_instructors", []).filter(i => i.courses.includes(v)));
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الكورس" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {newGroup.courseId && (
              <div>
                <label className="block mb-1 font-bold">المستوى</label>
                <Select value={newGroup.levelId} onValueChange={v => setNewGroup((g: any) => ({ ...g, levelId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.courseName} - مستوى {l.levelNumber} (كود: {l.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="block mb-1 font-bold">الفرع</label>
              <Select value={newGroup.branchId} onValueChange={v => setNewGroup((g: any) => ({ ...g, branchId: v, labId: "" }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-bold">القاعة</label>
              <Select value={newGroup.labId} onValueChange={v => setNewGroup((g: any) => ({ ...g, labId: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر القاعة" /></SelectTrigger>
                <SelectContent>
                  {labs.filter(l => l.branchId === newGroup.branchId).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-bold">المحاضر</label>
              <Select value={newGroup.instructorId} onValueChange={v => setNewGroup((g: any) => ({ ...g, instructorId: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر المحاضر" /></SelectTrigger>
                <SelectContent>
                  {instructors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-bold">أيام الأسبوع</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  "السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"
                ].map(day => (
                  <Button key={day} variant={newGroup.weeklyDays.includes(day) ? "default" : "outline"} size="sm" onClick={() => setNewGroup((g: any) => ({ ...g, weeklyDays: g.weeklyDays.includes(day) ? g.weeklyDays.filter((d: string) => d !== day) : [...g.weeklyDays, day] }))}>{day}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold">تاريخ البداية</label>
              <Input
                placeholder="تاريخ البداية"
                type="date"
                value={newGroup.startDate}
                onChange={e => setNewGroup((g: any) => ({ ...g, startDate: e.target.value }))}
                onBlur={e => {
                  // تحقق أن اليوم المختار ضمن الأيام الأسبوعية
                  const dayName = getArabicDayName(new Date(e.target.value).getDay());
                  if (newGroup.weeklyDays.length && !newGroup.weeklyDays.includes(dayName)) {
                    alert("يجب أن يكون يوم بداية المجموعة ضمن الأيام الأسبوعية المحددة!");
                    setNewGroup((g: any) => ({ ...g, startDate: "" }));
                  }
                }}
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">وقت البداية</label>
              <Select
                value={newGroup.startTime}
                onValueChange={v => setNewGroup((g: any) => ({ ...g, startTime: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ساعة البداية" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => {
                    const hour = 8 + Math.floor(i / 2);
                    const min = i % 2 === 0 ? "00" : "30";
                    return (
                      <SelectItem key={`${hour}:${min}`} value={`${hour.toString().padStart(2,"0")}:${min}`}>{`${hour.toString().padStart(2,"0")}:${min}`}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-bold">مدة المحاضرة بالساعات (مثال: 1.5)</label>
              <Input
                placeholder="مدة المحاضرة بالساعات"
                type="number"
                min={0.5}
                step={0.5}
                value={newGroup.duration}
                onChange={e => setNewGroup((g: any) => ({ ...g, duration: e.target.value }))}
              />
            </div>
            <div>
              <label className="block mb-1 font-bold">حالة المجموعة</label>
              <Select value={newGroup.status} onValueChange={v => setNewGroup((g: any) => ({ ...g, status: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="حالة المجموعة" /></SelectTrigger>
                <SelectContent>
                  {GROUP_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <label className="block mb-1 font-bold">تاريخ النهاية</label>
              <Input type="date" placeholder="تاريخ النهاية" value={newGroup.endDate} disabled />
            </div>
            <div>
              <label className="block mb-1 font-bold">إضافة طلاب (بحث بالاسم أو الهاتف أو رقم الابليكيشن)</label>
              <Input placeholder="بحث عن طالب..." value={searchStudent} onChange={e => setSearchStudent(e.target.value)} />
              <div className="max-h-32 overflow-auto border rounded p-2 mt-1">
                {filteredStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={newGroup.studentIds.includes(s.id)} onChange={() => handleStudentSelect(s.id)} />
                    <span>{s.name} - {s.mobile} - {s.applicationNumber || ""}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-bold">السعر</label>
              <Input
                placeholder="السعر"
                type="number"
                min={0}
                value={newGroup.price}
                onChange={e => setNewGroup((g: any) => ({ ...g, price: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddGroup}>حفظ المجموعة</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog تفاصيل المجموعة */}
      <Dialog open={detailsDialog.open} onOpenChange={open => setDetailsDialog({ open, group: open ? detailsDialog.group : null })}>
        <DialogContent className="max-h-[80vh] max-w-[98vw] overflow-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل المجموعة</DialogTitle>
          </DialogHeader>
          {detailsDialog.group && (
            <div className="space-y-2 text-sm">
              <div><b>الكود:</b> {detailsDialog.group.code}</div>
              <div><b>الاسم:</b> {detailsDialog.group.name}</div>
              <div><b>الفرع:</b> {branches.find(b => b.id === detailsDialog.group.branchId)?.name}</div>
              <div><b>القاعة:</b> {labs.find(l => l.id === detailsDialog.group.labId)?.name}</div>
              <div><b>المدرس:</b> {instructors.find(i => i.id === detailsDialog.group.instructorId)?.name}</div>
              <div><b>الدورة:</b> {courses.find(c => c.id === detailsDialog.group.courseId)?.name}</div>
              <div><b>المستوى:</b> {levels.find(l => l.id === detailsDialog.group.levelId)?.levelNumber}</div>
              <div><b>تاريخ البداية:</b> {detailsDialog.group.startDate}</div>
              <div><b>الوقت:</b> {detailsDialog.group.startTime}</div>
              <div><b>المدة:</b> {detailsDialog.group.duration} ساعة</div>
              <div><b>الأيام:</b> {detailsDialog.group.weeklyDays?.join(", ")}</div>
              <div><b>الحالة:</b> {detailsDialog.group.status}</div>
              <div><b>السعر:</b> {detailsDialog.group.price}</div>
              <div><b>الطلاب:</b>
                <ul className="list-disc ps-6">
                  {detailsDialog.group.studentIds?.length ?
                    detailsDialog.group.studentIds.map((sid: string) => {
                      const st = students.find(s => s.id === sid);
                      return st ? <li key={sid}>{st.name} ({st.mobile})</li> : null;
                    }) : <li>لا يوجد طلاب</li>}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialog({ open: false, group: null })}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog تعديل المجموعة */}
      <Dialog open={editDialog.open} onOpenChange={open => setEditDialog({ open, group: open ? editDialog.group : null })}>
        <DialogContent className="max-h-[80vh] max-w-[98vw] overflow-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المجموعة</DialogTitle>
          </DialogHeader>
          {editDialog.group && (
            <div className="space-y-2">
              <div>
                <label className="block mb-1 font-bold">اسم المجموعة</label>
                <Input value={editGroupData?.name || ""} onChange={e => setEditGroupData({ ...editGroupData, name: e.target.value })} placeholder="اسم المجموعة" />
              </div>
              <div>
                <label className="block mb-1 font-bold">الكود</label>
                <Input value={editGroupData?.code || ""} onChange={e => setEditGroupData({ ...editGroupData, code: e.target.value })} placeholder="الكود" />
              </div>
              <div>
                <label className="block mb-1 font-bold">تاريخ البداية</label>
                <Input value={editGroupData?.startDate || ""} onChange={e => setEditGroupData({ ...editGroupData, startDate: e.target.value })} placeholder="تاريخ البداية" type="date" />
              </div>
              <div>
                <label className="block mb-1 font-bold">الوقت</label>
                <Input value={editGroupData?.startTime || ""} onChange={e => setEditGroupData({ ...editGroupData, startTime: e.target.value })} placeholder="الوقت" type="time" />
              </div>
              <div>
                <label className="block mb-1 font-bold">المدة</label>
                <Input value={editGroupData?.duration || ""} onChange={e => setEditGroupData({ ...editGroupData, duration: e.target.value })} placeholder="المدة" type="number" step="0.5" />
              </div>
              <div>
                <label className="block mb-1 font-bold">بحث عن الطلاب:</label>
                <Input
                  type="text"
                  placeholder="بحث بالاسم أو رقم الابليكيشن أو الموبايل"
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)}
                  className="my-2"
                />
                <div className="flex flex-wrap gap-2 my-2 max-h-40 overflow-y-auto">
                  {students.filter(st => {
                    const q = searchStudent.trim().toLowerCase();
                    return !q ||
                      st.name.toLowerCase().includes(q) ||
                      (st.id && st.id.toLowerCase().includes(q)) ||
                      (st.mobile && st.mobile.toLowerCase().includes(q));
                  }).map(st => (
                    <label key={st.id} className="flex items-center gap-1 border px-2 py-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editGroupData?.studentIds?.includes(st.id) || false}
                        onChange={e => {
                          const checked = e.target.checked;
                          setEditGroupData((g: any) => ({
                            ...g,
                            studentIds: checked
                              ? [...(g.studentIds || []), st.id]
                              : (g.studentIds || []).filter((sid: string) => sid !== st.id)
                          }));
                        }}
                      />
                      {st.name} <span className="text-xs text-gray-500">({st.id} - {st.mobile})</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block mb-1 font-bold">الطلاب المضافون للمجموعة:</label>
                  <ul className="list-disc ps-6">
                    {editGroupData?.studentIds?.length ?
                      editGroupData.studentIds.map((sid: string) => {
                        const st = students.find(s => s.id === sid);
                        return st ? <li key={sid}>{st.name} ({st.mobile})</li> : null;
                      }) : <li>لا يوجد طلاب</li>}
                  </ul>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-bold">السعر</label>
                <Input
                  placeholder="السعر"
                  type="number"
                  min={0}
                  value={editGroupData?.price || ""}
                  onChange={e => setEditGroupData({ ...editGroupData, price: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditGroupSave}>حفظ التعديلات</Button>
            <Button variant="secondary" onClick={() => setEditDialog({ open: false, group: null })}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog تأكيد الحذف */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open, group: open ? deleteDialog.group : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف المجموعة</DialogTitle>
          </DialogHeader>
          <div>هل أنت متأكد أنك تريد حذف المجموعة <b>{deleteDialog.group?.name}</b>؟ لا يمكن التراجع عن هذه العملية.</div>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDeleteGroup}>حذف</Button>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, group: null })}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>قائمة المجموعات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>اسم المجموعة</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>القاعة</TableHead>
                <TableHead>المدرس</TableHead>
                <TableHead>تاريخ البداية</TableHead>
                <TableHead>الوقت</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.code}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{branches.find(b => b.id === group.branchId)?.name}</TableCell>
                  <TableCell>{labs.find(l => l.id === group.labId)?.name}</TableCell>
                  <TableCell>{instructors.find(i => i.id === group.instructorId)?.name}</TableCell>
                  <TableCell>{group.startDate}</TableCell>
                  <TableCell>{group.startTime}</TableCell>
                  <TableCell>{group.status}</TableCell>
                  <TableCell>{group.price}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleShowDetails(group)} title="عرض التفاصيل"><Eye className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleEditGroup(group)} title="تعديل"><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteGroup(group)} title="حذف"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

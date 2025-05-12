import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Branch, Course, Payment } from "@/utils/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Group {
  id: string;
  name: string;
  courseId: string;
  branchId: string;
  startDate: string;
  students: string[]; // student ids
}

interface Student {
  id: string;
  name: string;
  mobile: string;
}

export default function Booking() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; studentId: string; groupId: string }>({ open: false, studentId: "", groupId: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentHistoryDialog, setPaymentHistoryDialog] = useState<{ open: boolean; studentId: string; groupId: string }>({ open: false, studentId: "", groupId: "" });
  const { toast } = useToast();

  // نموذج إضافة مجموعة جديدة
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    courseId: "",
    branchId: "",
    startDate: ""
  });

  useEffect(() => {
    setStudents(getFromLocalStorage<Student[]>("latin_academy_students", []));
    setGroups(getFromLocalStorage<Group[]>("latin_academy_groups", []));
    setBranches(getFromLocalStorage<Branch[]>("latin_academy_branches", []));
    setCourses(getFromLocalStorage<Course[]>("latin_academy_courses", []));
    setPayments(getFromLocalStorage<Payment[]>("latin_academy_payments", []));
  }, []);

  const handleBook = () => {
    if (!selectedStudent || !selectedGroup) {
      toast({ title: "يرجى اختيار طالب ومجموعة" });
      return;
    }
    // تحديث بيانات المجموعة
    const updatedGroups = groups.map(g => g.id === selectedGroup ? { ...g, students: [...(g.students || []), selectedStudent] } : g);
    setGroups(updatedGroups);
    saveToLocalStorage("latin_academy_groups", updatedGroups);
    // فتح نافذة الدفع
    setPaymentDialog({ open: true, studentId: selectedStudent, groupId: selectedGroup });
  };

  const handleAddGroup = () => {
    if (!newGroup.name || !newGroup.courseId || !newGroup.branchId || !newGroup.startDate) {
      toast({ title: "يرجى ملء جميع بيانات المجموعة" });
      return;
    }
    const group = {
      id: generateId("grp-"),
      name: newGroup.name,
      courseId: newGroup.courseId,
      branchId: newGroup.branchId,
      startDate: newGroup.startDate,
      students: []
    };
    const updatedGroups = [...groups, group];
    setGroups(updatedGroups);
    saveToLocalStorage("latin_academy_groups", updatedGroups);
    toast({ title: "تمت إضافة المجموعة بنجاح" });
    setIsGroupDialogOpen(false);
    setNewGroup({ name: "", courseId: "", branchId: "", startDate: "" });
  };

  const handleSavePayment = () => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      toast({ title: "يرجى إدخال مبلغ صحيح" });
      return;
    }
    const payment: Payment = {
      id: generateId("pay-"),
      studentId: paymentDialog.studentId,
      groupId: paymentDialog.groupId,
      amount: Number(paymentAmount),
      date: new Date().toISOString(),
      status: "paid",
      note: paymentNote
    };
    const updatedPayments = [...payments, payment];
    setPayments(updatedPayments);
    saveToLocalStorage("latin_academy_payments", updatedPayments);
    setPaymentDialog({ open: false, studentId: "", groupId: "" });
    setPaymentAmount("");
    setPaymentNote("");
    toast({ title: "تم تسجيل الدفعة بنجاح" });
  };

  const getStudentPayment = (studentId: string, groupId: string) => {
    return payments.filter(p => p.studentId === studentId && p.groupId === groupId);
  };

  const getStudentBalance = (studentId: string, groupId: string) => {
    const total = courses.find(c => c.id === groups.find(g => g.id === groupId)?.courseId)?.totalPrice || 0;
    const paid = getStudentPayment(studentId, groupId).reduce((acc, p) => acc + p.amount, 0);
    return total - paid;
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-end">
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">إضافة مجموعة جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input placeholder="اسم المجموعة" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
              <Select value={newGroup.courseId} onValueChange={v => setNewGroup({ ...newGroup, courseId: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر الكورس" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newGroup.branchId} onValueChange={v => setNewGroup({ ...newGroup, branchId: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={newGroup.startDate} onChange={e => setNewGroup({ ...newGroup, startDate: e.target.value })} />
              <Button onClick={handleAddGroup}>حفظ المجموعة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>حجز طالب في مجموعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="w-full md:w-1/2">
              <label className="block mb-2">اختر الطالب</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.mobile})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/2">
              <label className="block mb-2">اختر المجموعة</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-6" onClick={handleBook}>حجز الطالب</Button>
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>قائمة الحجوزات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المجموعة</TableHead>
                <TableHead>الكورس</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الطلاب المسجلون</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(g => (
                <TableRow key={g.id}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell>{courses.find(c => c.id === g.courseId)?.name || "-"}</TableCell>
                  <TableCell>{branches.find(b => b.id === g.branchId)?.name || "-"}</TableCell>
                  <TableCell>
                    {g.students && g.students.length > 0 ? (
                      g.students.map(sid => {
                        const stu = students.find(st => st.id === sid);
                        const paid = getStudentPayment(sid, g.id).reduce((acc, p) => acc + p.amount, 0);
                        const total = courses.find(c => c.id === g.courseId)?.totalPrice || 0;
                        const balance = total - paid;
                        // تنبيه إذا كان عليه متبقي
                        let alert = "";
                        if (balance > 0) alert = ` ⚠️ متبقي: ${balance}`;
                        return stu ? (
                          <span key={sid}>
                            {stu.name} (مدفوع: {paid} / {total})
                            <Button size="sm" variant="ghost" className="ml-1" onClick={() => setPaymentDialog({ open: true, studentId: sid, groupId: g.id })}>دفعة جديدة</Button>
                            <Button size="sm" variant="outline" className="ml-1" onClick={() => setPaymentHistoryDialog({ open: true, studentId: sid, groupId: g.id })}>سجل المدفوعات</Button>
                            {alert}
                          </span>
                        ) : sid;
                      })
                    ) : "لا يوجد"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={paymentDialog.open} onOpenChange={open => setPaymentDialog(v => ({ ...v, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة للطالب</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input type="number" placeholder="المبلغ المدفوع" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            <Input placeholder="ملاحظات (اختياري)" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
            <Button onClick={handleSavePayment}>حفظ الدفعة</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={paymentHistoryDialog.open} onOpenChange={open => setPaymentHistoryDialog(v => ({ ...v, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سجل المدفوعات</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {getStudentPayment(paymentHistoryDialog.studentId, paymentHistoryDialog.groupId).length === 0 ? (
              <div>لا توجد مدفوعات مسجلة</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getStudentPayment(paymentHistoryDialog.studentId, paymentHistoryDialog.groupId).map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                      <TableCell>{p.amount}</TableCell>
                      <TableCell>{p.note || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

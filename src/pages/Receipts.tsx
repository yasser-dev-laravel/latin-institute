import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Payment, Student, Group, Employee, CourseLevel } from "@/utils/mockData";
import { Trash, Printer, MessageCircle } from "lucide-react";

const receiptTypes = [
  "حساب كورس", "تحديد مستوي", "شهادة", "استرداد", "حضور ولي امر", "كتاب", "مذكرة", "أخري"
];

const getCurrentYearShort = () => {
  const now = new Date();
  return now.getFullYear().toString().slice(-2);
};

const generateReceiptNumber = (receipts: Payment[]) => {
  const year = getCurrentYearShort();
  const yearReceipts = receipts.filter(r => r.id.startsWith(year));
  const lastNum = yearReceipts.length > 0
    ? Math.max(...yearReceipts.map(r => parseInt(r.id.slice(2))))
    : 10000;
  return `${year}${lastNum + 1}`;
};

const Receipts = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [receipts, setReceipts] = useState<Payment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [date, setDate] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [whatsappMsg, setWhatsappMsg] = useState<string>("");

  // Load data
  useEffect(() => {
    setStudents(getFromLocalStorage<Student[]>("latin_academy_students", []));
    setGroups(getFromLocalStorage<Group[]>("latin_academy_groups", []));
    setLevels(getFromLocalStorage<CourseLevel[]>("latin_academy_levels", []));
    setEmployees(getFromLocalStorage<Employee[]>("latin_academy_employees", []));
    setReceipts(getFromLocalStorage<Payment[]>("latin_academy_receipts", []));
    // Assume employeeId is from logged in user (mock)
    setEmployeeId("emp-loggedin");
    setDate(new Date().toISOString().slice(0, 10));
    setBranches(getFromLocalStorage("latin_academy_branches", []));
    const def = localStorage.getItem("latin_academy_default_branch");
    if (def) setBranch(def);
  }, []);

  // Filter groups by student
  const studentGroups = groups.filter(g => selectedStudent && g.studentIds.includes(selectedStudent));

  // جلب بيانات المجموعة والمستوى
  const selectedGroupObj = groups.find(g => g.id === selectedGroup);
  const selectedLevelObj = selectedGroupObj ? levels.find(l => l.id === selectedGroupObj.levelId) : null;

  // مبلغ المستوى
  const groupLevelAmount = selectedGroupObj ? selectedGroupObj.price : 0;
  // عدد محاضرات المستوى
  const groupLectureCount = selectedGroupObj ? selectedGroupObj.lectureCount : 0;

  // المبلغ المدفوع سابقا
  const previouslyPaid = receipts.filter(r => r.studentId === selectedStudent && r.groupId === selectedGroup)
    .reduce((sum, r) => sum + r.amount, 0);

  // المبلغ المتبقي
  const remaining = groupLevelAmount - previouslyPaid - paidNow;

  // --- قالب الطباعة ---
  const printRef = React.useRef<HTMLDivElement>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const handlePrint = () => {
    if (!printData) return;
    setShowPrint(true);
    setTimeout(() => {
      const printContents = document.querySelector('.print-receipt')?.outerHTML;
      const printWindow = window.open('', '', 'width=600,height=800');
      if (printWindow && printContents) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>إيصال دفع</title><style>body{direction:rtl;font-family:Cairo,sans-serif;padding:24px;}@media print{.print-receipt{margin:auto;}}</style></head><body>${printContents}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
      setShowPrint(false);
    }, 400);
  };

  // عند الحفظ جهز بيانات الطباعة
  const handleSave = () => {
    if (!selectedStudent || !selectedType || !paidNow) return;
    const newId = generateReceiptNumber(receipts);
    // جلب بيانات المجموعة والمستوى
    const group = groups.find(g => g.id === selectedGroup);
    const level = group ? levels.find(l => l.id === group.levelId) : null;
    const newReceipt: Payment & { branch?: string; employeeId?: string; groupLevelAmount?: number } = {
      id: newId,
      studentId: selectedStudent,
      groupId: selectedType === "حساب كورس" ? selectedGroup : "",
      amount: paidNow,
      date,
      status: "paid",
      note: selectedType,
      branch,
      employeeId,
      groupLevelAmount: selectedType === "حساب كورس" ? (group?.price ?? 0) : undefined,
      previouslyPaid,
      remaining
    };
    const updatedReceipts = [...receipts, newReceipt];
    setReceipts(updatedReceipts);
    saveToLocalStorage("latin_academy_receipts", updatedReceipts);
    const student = students.find(s => s.id === selectedStudent);
    setWhatsappMsg(
      `إيصال رقم ${newId}\nالطالب: ${student?.name}\nرقم الابليكيشن: ${student?.applicationNumber}\nالفرع: ${branches.find(b => b.id === branch)?.name || branch}\nالموظف: ${employeeId}\nالتاريخ: ${date}\nنوع الإيصال: ${selectedType}\n`+
      (selectedType === "حساب كورس" ? `كود المجموعة: ${group?.code}\nكود المستوى: ${level?.code}\nعدد محاضرات المستوى: ${level?.lectureCount}\nمبلغ المستوى: ${level?.price ?? 0}\nالمدفوع سابقا: ${previouslyPaid}\n` : "")+
      `المبلغ المدفوع: ${paidNow}\nالمتبقي: ${remaining}`
    );
    setPrintData({
      id: newId,
      student,
      branch: branches.find(b => b.id === branch)?.name || branch,
      employeeId,
      date,
      selectedType,
      selectedGroup: group?.code,
      selectedLevel: level?.code,
      groupLectureCount: level?.lectureCount,
      groupLevelAmount: group?.price ?? 0,
      previouslyPaid,
      paidNow,
      remaining
    });
    // Reset input fields after save
    setSelectedStudent("");
    setSelectedType("");
    setSelectedGroup("");
    setAmount(0);
    setPaidNow(0);
    setWhatsappMsg("");
  };

  // --- واجهة الطباعة ---
  const ReceiptPrint = () => printData && (
    <div ref={printRef} style={{ direction: 'rtl', padding: 24, background: '#fff', color: '#222', fontFamily: 'Cairo, sans-serif', width: 400, margin: 'auto' }} className="print-receipt">
      <h2 style={{ textAlign: 'center', marginBottom: 12 }}>إيصال دفع</h2>
      <div>رقم الإيصال: <b>{printData.id}</b></div>
      <div>اسم الطالب: <b>{printData.student?.name}</b></div>
      <div>رقم الابليكيشن: <b>{printData.student?.applicationNumber}</b></div>
      <div>الفرع: <b>{printData.branch}</b></div>
      <div>الموظف: <b>{printData.employeeId}</b></div>
      <div>التاريخ: <b>{printData.date}</b></div>
      <div>نوع الإيصال: <b>{printData.selectedType}</b></div>
      {printData.selectedType === "حساب كورس" && (
        <>
          <div>كود المجموعة: <b>{printData.selectedGroup}</b></div>
          <div>كود المستوى: <b>{printData.selectedLevel}</b></div>
          <div>عدد محاضرات المستوى: <b>{printData.groupLectureCount}</b></div>
          <div>مبلغ المستوى: <b>{printData.groupLevelAmount}</b></div>
          <div>المدفوع سابقا: <b>{printData.previouslyPaid}</b></div>
        </>
      )}
      <div>المبلغ المدفوع: <b>{printData.paidNow}</b></div>
      <div>المتبقي: <b>{printData.remaining}</b></div>
      <div style={{marginTop: 16, textAlign: 'center', fontSize: 13, color: '#666'}}>لاتعتبر الإيصال ساريًا إلا بتوقيع وختم الإدارة</div>
    </div>
  );

  // --- رسالة واتساب مخصصة ---
  const handleSendWhatsapp = () => {
    if (!whatsappMsg || !selectedStudent) return;
    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;
    const url = `https://wa.me/${student.mobile}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, "_blank");
  };

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>إدارة الإيصالات</CardTitle>
        <CardDescription>تسجيل واستعراض إيصالات الدفع للطلاب</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-end">
            <div className="flex flex-col w-56">
              <label className="mb-1 font-bold">الطالب</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
                <SelectContent>
                  {students.map(stu => (
                    <SelectItem key={stu.id} value={stu.id}>{stu.name} ({stu.applicationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col w-40">
              <label className="mb-1 font-bold">التاريخ</label>
              <Input value={date} onChange={e => setDate(e.target.value)} type="date" />
            </div>
            <div className="flex flex-col w-40">
              <label className="mb-1 font-bold">الفرع</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col w-40">
              <label className="mb-1 font-bold">كود الموظف</label>
              <Input value={employeeId} readOnly />
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex flex-col w-56">
              <label className="mb-1 font-bold">نوع الإيصال</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="نوع الإيصال" /></SelectTrigger>
                <SelectContent>
                  {receiptTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedType === "حساب كورس" && (
              <div className="flex flex-col w-56">
                <label className="mb-1 font-bold">كود المجموعة</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger><SelectValue placeholder="كود المجموعة" /></SelectTrigger>
                  <SelectContent>
                    {studentGroups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(selectedType !== "حساب كورس") && (
              <div className="flex flex-col w-40">
                <label className="mb-1 font-bold">المبلغ المدفوع</label>
                <Input value={paidNow} onChange={e => setPaidNow(Number(e.target.value))} type="number" placeholder="المبلغ المدفوع" />
              </div>
            )}
          </div>
          {/* تفاصيل المبالغ عند حساب كورس */}
          {selectedType === "حساب كورس" && selectedGroup && (
            <div className="flex gap-2">
              <div className="flex flex-col w-40">
                <label className="mb-1 font-bold">مبلغ المستوى</label>
                <Input value={groupLevelAmount} readOnly disabled placeholder="مبلغ المستوى" />
              </div>
              <div className="flex flex-col w-40">
                <label className="mb-1 font-bold">المدفوع سابقا</label>
                <Input value={previouslyPaid} readOnly disabled placeholder="المدفوع سابقا" />
              </div>
              <div className="flex flex-col w-40">
                <label className="mb-1 font-bold">المدفوع حاليا</label>
                <Input value={paidNow} onChange={e => setPaidNow(Number(e.target.value))} placeholder="المدفوع حاليا" type="number" />
              </div>
              <div className="flex flex-col w-40">
                <label className="mb-1 font-bold">المتبقي</label>
                <Input value={remaining} readOnly disabled placeholder="المتبقي" />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave}>حفظ</Button>
            <Button onClick={handlePrint} variant="outline" disabled={!printData}>طباعة</Button>
            <Button onClick={handleSendWhatsapp} variant="secondary" disabled={!whatsappMsg}>إرسال واتساب</Button>
          </div>
        </div>
        {showPrint && <ReceiptPrint />}
        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الإيصال</TableHead>
                <TableHead>الطالب</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الموظف</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>مبلغ المستوى</TableHead>
                <TableHead>كود المجموعة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map(r => {
                const stu = students.find(s => s.id === r.studentId);
                const branchName = r.branch ? (branches.find(b => b.id === r.branch)?.name || r.branch) : (branches.find(b => b.id === branch)?.name || branch);
                const empId = r.employeeId || employeeId;
                const group = groups.find(g => g.id === r.groupId);
                const level = group ? levels.find(l => l.id === group.levelId) : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{stu?.name}</TableCell>
                    <TableCell>{branchName}</TableCell>
                    <TableCell>{empId}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.note}</TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>{level?.price ?? r.groupLevelAmount}</TableCell>
                    <TableCell>{r.groupId}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setPrintData({
                          ...r,
                          student: stu,
                          branch: branchName,
                          employeeId: empId,
                          selectedType: r.note,
                          selectedGroup: group?.code || r.groupId,
                          selectedLevel: level?.code,
                          groupLectureCount: level?.lectureCount,
                          groupLevelAmount: group?.price ?? r.groupLevelAmount,
                          previouslyPaid: r.previouslyPaid,
                          paidNow: r.amount,
                          remaining: r.remaining
                        });
                        setShowPrint(true);
                        setTimeout(() => handlePrint(), 100);
                      }} title="طباعة الإيصال">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        const msg = `إيصال رقم ${r.id}\nالطالب: ${stu?.name}\nرقم الابليكيشن: ${stu?.applicationNumber}\nالفرع: ${branchName}\nالموظف: ${empId}\nالتاريخ: ${r.date}\nنوع الإيصال: ${r.note}\n${r.note === "حساب كورس" ? `كود المجموعة: ${group?.code || r.groupId}\nكود المستوى: ${level?.code}\nعدد محاضرات المستوى: ${level?.lectureCount}\nمبلغ المستوى: ${level?.price ?? r.groupLevelAmount}\nالمدفوع سابقا: ${r.previouslyPaid}\n` : ""}المبلغ المدفوع: ${r.amount}\nالمتبقي: ${r.remaining}`;
                        const url = `https://wa.me/${stu?.mobile}?text=${encodeURIComponent(msg)}`;
                        window.open(url, "_blank");
                      }} title="إرسال واتساب">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        if(window.confirm('هل تريد عمل إيصال استرداد لهذا الطالب؟')) {
                          const refundId = generateReceiptNumber(receipts);
                          const refundReceipt = { ...r, id: refundId, amount: r.amount, note: "استرداد", status: "refund", date: new Date().toISOString().slice(0, 10) };
                          const updatedReceipts = [...receipts, refundReceipt];
                          setReceipts(updatedReceipts);
                          saveToLocalStorage("latin_academy_receipts", updatedReceipts);
                        }
                      }} title="استرداد">
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Receipts;

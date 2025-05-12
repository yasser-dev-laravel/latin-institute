import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { getFromLocalStorage } from '@/utils/localStorage';

interface Payment {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  date: string;
  status: string;
  note?: string;
}

interface Group {
  id: string;
  name: string;
  courseId: string;
  levelId: string;
  lectureCount: number;
  studentIds?: string[];
  price: number;
}

interface CourseLevel {
  id: string;
  price: number;
}

interface StudentReceiptsProps {
  studentId: string;
}

const StudentSummary: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [receipts, setReceipts] = useState<Payment[]>([]);

  useEffect(() => {
    setGroups(getFromLocalStorage<Group[]>("latin_academy_groups", []));
    setLevels(getFromLocalStorage<CourseLevel[]>("latin_academy_levels", []));
    setReceipts(getFromLocalStorage<Payment[]>("latin_academy_receipts", []).filter(r => r.studentId === studentId));
  }, [studentId]);

  // Find groups joined by this student
  const studentGroups = groups.filter(g => g.studentIds && g.studentIds.includes(studentId));

  // For each group, get its level and sum its price from levels array (not lectureCount)
  let totalLevelAmount = 0;
  studentGroups.forEach(g => {
    // ابحث عن المستوى الصحيح لهذا الجروب
    // const level = levels.find(l => l.id === g.levelId);
    if ( typeof g.price === 'number') {
      totalLevelAmount += g.price;
    }
  });

  // Only receipts for course payments
  const paidReceipts = receipts.filter(r => r.status === 'paid');
  const totalPaid = paidReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const remaining = totalLevelAmount - totalPaid;

  return (
    <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
      <div>اجمالي مبلغ المستويات: <span className="font-bold">{totalLevelAmount} ج.م</span></div>
      <div>اجمالي المدفوع: <span className="font-bold">{totalPaid} ج.م</span></div>
      <div>المبلغ المطلوب: <span className="font-bold text-red-600">{remaining > 0 ? remaining : 0} ج.م</span></div>
    </div>
  );
};

const StudentReceipts: React.FC<StudentReceiptsProps> = ({ studentId }) => {
  const [receipts, setReceipts] = useState<Payment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    setReceipts(getFromLocalStorage<Payment[]>("latin_academy_receipts", []).filter(r => r.studentId === studentId));
    setGroups(getFromLocalStorage<Group[]>("latin_academy_groups", []));
  }, [studentId]);

  if (!studentId) return null;

  return (
    <>
      <StudentSummary studentId={studentId} />
      {receipts.length === 0 ? (
        <div className="text-gray-500">لا يوجد إيصالات لهذا الطالب.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الإيصال</TableHead>
              <TableHead>المجموعة</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>ملاحظة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map(r => {
              const group = groups.find(g => g.id === r.groupId);
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{group ? group.name : r.groupId}</TableCell>
                  <TableCell>{r.amount}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.note || ''}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default StudentReceipts;
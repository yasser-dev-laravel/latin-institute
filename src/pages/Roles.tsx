import React, { useState, useEffect } from "react";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription
} from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getFromLocalStorage, saveToLocalStorage, generateId } from "@/utils/localStorage";
import { Role, Permission } from "@/utils/mockData";

const allScreens = [
  "Employees", "Groups", "Students", "Courses", "Branches", "Labs", "Departments", "Attendance", "Settings"
];

const defaultPermissions = (screens: string[]): Permission[] =>
  screens.map(screen => ({ screen, view: false, add: false, edit: false, delete: false }));

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Role>>({
    name: "",
    code: "",
    permissions: defaultPermissions(allScreens)
  });

  useEffect(() => {
    setRoles(getFromLocalStorage<Role[]>("latin_academy_roles", []));
  }, []);

  const handleOpen = (role?: Role, idx?: number) => {
    if (role && typeof idx === "number") {
      setForm({ ...role });
      setEditIndex(idx);
    } else {
      setForm({ name: "", code: "", permissions: defaultPermissions(allScreens) });
      setEditIndex(null);
    }
    setIsDialogOpen(true);
  };

  const handleChange = (field: keyof Role, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handlePermChange = (screen: string, perm: keyof Permission, value: boolean) => {
    setForm(f => ({
      ...f,
      permissions: (f.permissions || []).map(p =>
        p.screen === screen ? { ...p, [perm]: value } : p
      )
    }));
  };

  const handleSave = () => {
    if (!form.name || !form.code) return;
    let updatedRoles = [...roles];
    if (editIndex !== null) {
      updatedRoles[editIndex] = form as Role;
    } else {
      updatedRoles.push({
        ...form,
        id: generateId("role-"),
        permissions: form.permissions || defaultPermissions(allScreens)
      } as Role);
    }
    setRoles(updatedRoles);
    saveToLocalStorage("latin_academy_roles", updatedRoles);
    setIsDialogOpen(false);
  };

  const handleDelete = (idx: number) => {
    const updated = roles.filter((_, i) => i !== idx);
    setRoles(updated);
    saveToLocalStorage("latin_academy_roles", updated);
  };

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>إدارة الأدوار والصلاحيات</CardTitle>
        <CardDescription>أضف أو عدّل أو احذف الأدوار وحدد الصلاحيات لكل شاشة</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => handleOpen()} className="mb-4">إضافة دور جديد</Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الكود</TableHead>
              <TableHead>عدد الصلاحيات</TableHead>
              <TableHead>تعديل</TableHead>
              <TableHead>حذف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role, idx) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.code}</TableCell>
                <TableCell>{role.permissions.length}</TableCell>
                <TableCell><Button variant="outline" onClick={() => handleOpen(role, idx)}>تعديل</Button></TableCell>
                <TableCell><Button variant="destructive" onClick={() => handleDelete(idx)}>حذف</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "تعديل الدور" : "إضافة دور جديد"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="اسم الدور"
              value={form.name || ""}
              onChange={e => handleChange("name", e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="كود الدور"
              value={form.code || ""}
              onChange={e => handleChange("code", e.target.value)}
              className="mb-2"
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشاشة</TableHead>
                    <TableHead>عرض</TableHead>
                    <TableHead>إضافة</TableHead>
                    <TableHead>تعديل</TableHead>
                    <TableHead>حذف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(form.permissions || []).map((perm, idx) => (
                    <TableRow key={perm.screen}>
                      <TableCell>{perm.screen}</TableCell>
                      {(["view", "add", "edit", "delete"] as (keyof Permission)[]).map(type => (
                        <TableCell key={type}>
                          <input
                            type="checkbox"
                            checked={perm[type]}
                            onChange={e => handlePermChange(perm.screen, type, e.target.checked)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{editIndex !== null ? "حفظ التعديلات" : "إضافة الدور"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Roles;

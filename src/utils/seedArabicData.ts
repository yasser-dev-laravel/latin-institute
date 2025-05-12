// سكريبت لإضافة بيانات افتراضية بالعربي للفروع والكورسات
import { Branch, Course } from "./mockData";
import { saveToLocalStorage } from "./localStorage";

export function seedArabicData() {
  const branches: Branch[] = [
    {
      id: "branch-1",
      code: "BR001",
      name: "الفرع الرئيسي - المعادي",
      governorate: "القاهرة"
    },
    {
      id: "branch-2",
      code: "BR002",
      name: "فرع مدينة نصر",
      governorate: "القاهرة"
    }
  ];

  const courses: Course[] = [
    {
      id: "course-1",
      code: "CRS001",
      name: "دبلومة اللغة اللاتينية",
      description: "برنامج شامل لتعلم اللغة اللاتينية من الصفر حتى الاحتراف.",
      departmentId: "dep-1",
      totalDuration: 60,
      totalPrice: 4000,
      levels: []
    },
    {
      id: "course-2",
      code: "CRS002",
      name: "دورة قواعد اللغة العربية",
      description: "شرح مفصل لقواعد النحو والصرف.",
      departmentId: "dep-2",
      totalDuration: 30,
      totalPrice: 2000,
      levels: []
    }
  ];

  saveToLocalStorage("latin_academy_branches", branches);
  saveToLocalStorage("latin_academy_courses", courses);
}

import * as XLSX from "xlsx";

export interface ParsedLead {
  name: string;
  mobile: string;
}

export function parseLeadsExcel(file: File): Promise<ParsedLead[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });
      // توقع أن أول صف رؤوس الأعمدة
      const header = rows[0] as string[];
      const nameIdx = header.findIndex(h => h.toLowerCase().includes("name") || h.includes("اسم"));
      const mobileIdx = header.findIndex(h => h.toLowerCase().includes("mobile") || h.includes("موبايل") || h.includes("رقم"));
      if (nameIdx === -1 || mobileIdx === -1) {
        reject("يجب أن يحتوي الملف على أعمدة للاسم ورقم الموبايل");
        return;
      }
      const leads: ParsedLead[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const name = row[nameIdx]?.toString() || "";
        const mobile = row[mobileIdx]?.toString() || "";
        if (name && mobile) {
          leads.push({ name, mobile });
        }
      }
      resolve(leads);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

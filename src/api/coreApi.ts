// ملف API موحد لدوال CRUD العامة لأي كيان
// جميع الدوال generic وقابلة لإعادة الاستخدام
// تعتمد على axios ويجب تمرير اسم endpoint المناسب

import axios from './axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * إنشاء عنصر جديد لأي كيان
 * @param endpoint اسم مسار الكيان (مثال: 'Users')
 * @param data بيانات العنصر الجديد
 * @returns العنصر بعد الإنشاء
 */
export const create = async <T>(endpoint: string, data: any): Promise<T> => {
  const res = await axios.post<T>(`${API_BASE_URL}/${endpoint}`, data);
  return res.data;
};

/**
 * جلب جميع العناصر لأي كيان
 * @param endpoint اسم مسار الكيان (مثال: 'Areas')
 * @returns مصفوفة العناصر
 */
export const getAll = async <T>(endpoint: string): Promise<T[]> => {
  try {
    // محاولة استخدام طريقة GET أولاً
    const res = await axios.get<T[]>(`${API_BASE_URL}/${endpoint}`);
    return res.data;
  } catch (error: any) {
    // إذا كان الخطأ 405 (طريقة غير مسموح بها)، حاول استخدام طريقة POST
    if (error.response && error.response.status === 405) {
      console.log(`Method GET not allowed for ${endpoint}, trying POST...`);
      try {
        // محاولة استخدام طريقة POST بدون معلمات
        const postRes = await axios.post<T[]>(`${API_BASE_URL}/${endpoint}`, {});
        return postRes.data;
      } catch (postError) {
        console.error(`POST request to ${endpoint} also failed:`, postError);
        throw postError;
      }
    }
    
    // إذا كان الخطأ من نوع آخر، أعد رميه
    throw error;
  }
};

/**
 * جلب العناصر بصفحات أو مع فلاتر لأي كيان
 * @param endpoint اسم مسار الكيان (مثال: 'Areas/pagination')
 * @param params باراميترات التصفية أو الصفحة (اختياري)
 * @returns نتيجة الاستعلام (عادة تشمل العناصر وعدد الصفحات)
 */
export const getByPagination = async <T>(endpoint: string, params?: any): Promise<T> => {
  const res = await axios.get<T>(`${API_BASE_URL}/${endpoint}`, { params });
  return res.data;
};

/**
 * جلب عنصر واحد بالمعرف لأي كيان
 * @param endpoint اسم مسار الكيان (مثال: 'Areas')
 * @param id معرف العنصر
 * @returns العنصر المطلوب
 */
export const getById = async <T>(endpoint: string, id: number | string): Promise<T> => {
  const res = await axios.get<T>(`${API_BASE_URL}/${endpoint}/${id}`);
  return res.data;
};

/**
 * تعديل عنصر بالمعرف لأي كيان
 * @param endpoint اسم مسار الكيان (مثال: 'Areas')
 * @param id معرف العنصر
 * @param data البيانات الجديدة
 * @returns العنصر بعد التعديل
 */
export const edit = async <T>(endpoint: string, id: number | string, data: any): Promise<T> => {
  const res = await axios.put<T>(`${API_BASE_URL}/${endpoint}/${id}`, data);
  return res.data;
};

/**
 * حذف عنصر بالمعرف لأي كيان
 * @param endpoint اسم مسار الكيان (مثال: 'Areas')
 * @param id معرف العنصر
 * @returns نتيجة الحذف
 */
export const deleteById = async <T>(endpoint: string, id: number | string): Promise<T> => {
  const res = await axios.delete<T>(`${API_BASE_URL}/${endpoint}/${id}`);
  return res.data;
};

/**
 * استرجاع عنصر محذوف بالمعرف لأي كيان (إذا كان النظام يدعم الاسترجاع)
 * @param endpoint اسم مسار الكيان (مثال: 'Areas')
 * @param id معرف العنصر
 * @returns نتيجة الاسترجاع
 */
export const restoreById = async <T>(endpoint: string, id: number | string): Promise<T> => {
  // غالباً يكون مسار الاسترجاع على النحو التالي: /{entity}/restore/{id}
  const res = await axios.put<T>(`${API_BASE_URL}/${endpoint}/restore/${id}`, {});
  return res.data;
};

// الدوال المميزة/الخاصة
// مثال: دالة تسجيل الدخول
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
import { UserDto, LoginResponse } from './coreTypes';

export const loginUser = async (
  userNameOrEmail: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  try {
    const res = await axios.post<LoginResponse>(
      `${API_BASE_URL}/Auth/login`,
      { userNameOrEmail, password },
      { headers: {} }
    );
    return { data: res.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || error.message || "Unknown error" };
  }
};

// مثال: دالة جلب المستخدم
export const getUser = async (
  id: number
): Promise<ApiResponse<UserDto>> => {
  try {
    const res = await axios.get<UserDto>(`${API_BASE_URL}/Users/${id}`);
    return { data: res.data };
  } catch (error: any) {
    return { error: error.response?.data?.message || error.message || "Unknown error" };
  }
};

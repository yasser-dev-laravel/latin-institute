// ============== Base Types ==============
export interface PaginationResultType<T> {
  data: T[] | null;
  total: number;
}

// ============== Location Types ==============
export interface CityGetAllType {
  id: number;
  name: string | null;
}
export interface CityGetByIdType {
  id: number;
  name: string | null;
}
export interface CityCreateType {
  name: string | null;
}

export interface CityEditType {
  id: number;
  name: string | null;
}

export interface AreaGetByIdType {
  id: number;
  name: string | null;
  cityId: number;
  cityName?: string | null;
}

export interface AreaCreateType {
  name: string | null;
  cityId: number;
}

export interface AreaEditType {
  id: number;
  name: string | null;
  cityId: number;
}

// ============== Branch Types ==============
export interface BrancheGetByIdType {
  id: number;
  name: string;
  address?: string | null;
  areaId: number;
  areaName?: string | null;
  campaignsCount?: number;
}

export interface BrancheCreateType {
  name: string;
  address: string;
  areaId: number;
}

export interface BrancheEditType {
  id: number;
  name?: string | null;
  address?: string | null;
  areaId?: number | null;
}

export interface BrancheGetAllType extends PaginationResultType<BrancheGetByIdType> {}

// ============== Room Types ==============
export enum RoomTypeEnum {
  Lab = "معمل",
  Hall = "قاعة"
}
export interface RoomTypesType {
  id: number;
  name: string;
}
export interface RoomGetByIdType {
  id: number;
  name: string;
  type: number  | null;
  capacity: number;
  branchId: number;
  branchName?: string | null;
}
export interface RoomGetAllType {
  id: number;
  name: string;
  type: number  | null;
  capacity: number;
  branchId: number;
  branchName?: string | null;
}

export interface RoomCreateType {
  name: string;
  type: number  | null;
  capacity?: number | null;
  branchId: number;
}

export interface RoomEditType {
  id: number;
  name?: string | null;
  type?: number | null;
  capacity?: number | null;
  branchId: number;
}

// ============== Category Types ==============
export interface CategoryGetByIdType {
  id: number;
  name: string;
  description?: string | null;
}

export interface CategoryCreateType {
  name: string;
  description?: string | null;
}

export interface CategoryEditType {
  id: number;
  name?: string | null;
  description?: string | null;
}

// ============== Level Types ==============
export interface LevelGetByIdType {
  id: number;
  code: string; // Auto-generated code like "COURSE-1"
  name: string;
  description?: string | null;
  price: number;
  sessionsCount: number;
  sessionsDiortion: number; // Duration in hours (decimal supported)
  courseId: number;
}

export interface LevelCreateType {
  name: string;
  description?: string | null;
  price: number;
  sessionsCount: number;
  sessionsDiortion: number;
}

export interface LevelEditType {
  id: number;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  sessionsCount?: number | null;
  sessionsDiortion?: number | null;
}

// ============== Course Types ==============
export interface CourseGetByIdType {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  categoryId: number;
  categoryName?: string | null;
  applicationId: number;
  levels: LevelGetByIdType[];
  totalDuration: number; // Calculated from sum of level durations * sessions
  totalPrice: number; // Calculated from sum of level prices
}

export interface CourseCreateType {
  name: string;
  description?: string | null;
  categoryId: number;
  isActive: boolean;
  levels: LevelCreateType[];
}

export interface CourseEditType {
  id: number;
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  categoryId?: number | null;
  levels: LevelEditType[];
}

// ============== Student Types ==============
export interface StudentGetByIdType {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  areaId?: number | null;
  birthdate?: string | null;
  applicationId: number;
  educationalQualificationDescriptionId?: number | null;
  educationalQualificationTypeId?: number | null;
  educationalQualificationIssuerId?: number | null;
  sourceId?: number | null;
  sourceName?: string | null;
}

export interface StudentCreateType {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  areaId?: number | null;
  birthdate?: string | null;
  educationalQualificationDescriptionId?: number | null;
  educationalQualificationTypeId?: number | null;
  educationalQualificationIssuerId?: number | null;
  studentSourceId?: number | null;
}

export interface StudentEditType {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  areaId?: number | null;
  birthdate?: string | null;
  educationalQualificationDescriptionId?: number | null;
  educationalQualificationTypeId?: number | null;
  educationalQualificationIssuerId?: number | null;
  studentSourceId?: number | null;
}

// ============== Lead Types ==============
export interface LeadGetByIdType {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  areaId?: number | null;
  birthdate?: string | null;
  educationalQualificationDescriptionId?: number | null;
  educationalQualificationTypeId?: number | null;
  educationalQualificationIssuerId?: number | null;
  studentSourceId?: number | null;
  studentId?: number | null;
  referenceId: string;
  campaignId: number;
  status?: string | null;
  createdAt: string;
  courseId: number;
  courseName?: string | null;
}

export interface LeadCreateType {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  areaId?: number | null;
  birthdate?: string | null;
  educationalQualificationDescriptionId?: number | null;
  educationalQualificationTypeId?: number | null;
  educationalQualificationIssuerId?: number | null;
  studentSourceId?: number | null;
  studentId?: number | null;
  campaignId: number;
  status?: string | null;
  courseId: number;
}

export interface LeadEditType extends LeadCreateType {
  id: number;
}

// ============== Group Types ==============
export enum GroupDaysEnum {
  None = "None",
  Saturday = "Saturday",
  Sunday = "Sunday",
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday"
}

export interface GroupGetByIdType {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  instructorId: number;
  instructorName?: string | null;
  branchId: number;
  branchName?: string | null;
  levelId: number;
  levelName?: string | null;
  courseId: number;
  courseName?: string | null;
  statusId: number;
  statusName?: string | null;
  roomId: number;
  roomName?: string | null;
  roomCapacity: number;
  applicationId: number;
  days: GroupDaysEnum;
  daysAsText?: string | null;
  startTime: string;
  endTime: string;
  students?: StudentGetByIdType[] | null;
  sessions?: SessionGetByIdType[] | null;
  daysArray?: number[] | null;
}

export interface GroupCreateType {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  startTime: string;
  endTime?: string | null;
  instructorId: number;
  levelId: number;
  roomId: number;
  statusId: number;
  studentIds?: number[] | null;
  days?: number[] | null;
}

export interface GroupEditType {
  id: number;
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string;
  endTime?: string | null;
  instructorId?: number;
  levelId?: number;
  roomId?: number;
  statusId?: number;
  studentIds?: number[] | null;
  days?: number[] | null;
}

// ============== Session Types ==============
export interface SessionGetByIdType {
  id: number;
  roomId: number;
  roomName?: string | null;
  instructorId: number;
  instructorName?: string | null;
  startTime: string;
  courseId: number;
  courseName?: string | null;
  studentsAbsent?: SessionStudentGetByIdType[] | null;
  groupId: number;
  groupName?: string | null;
  notes?: string | null;
  groupStudents?: StudentGetByIdType[] | null;
}

export interface SessionStudentGetByIdType {
  studentId: number;
  studentName?: string | null;
  studentPhone?: string | null;
  isPresent: boolean;
  notes?: string | null;
}

export interface SessionCreateType {
  roomId: number;
  instructorId: number;
  startTime: string;
  sessionStudents?: SessionStudentCreateType[] | null;
  groupId: number;
  notes?: string | null;
}

export interface SessionStudentCreateType {
  studentId: number;
  isPresent: boolean;
  notes?: string | null;
}

export interface SessionEditType {
  id: number;
  roomId?: number | null;
  instructorId?: number | null;
  startTime?: string | null;
  sessionStudents?: SessionStudentEditType[] | null;
  groupId: number;
  notes?: string | null;
  isCancelled?: boolean | null;
  isPostponed?: boolean | null;
}

export interface SessionStudentEditType {
  id: number;
  studentId: number;
  isPresent: boolean;
  notes?: string | null;
}

// ============== User Types ==============
export interface UserGetByIdType {
  id: number;
  name: string;
  email?: string | null;
  emailVerified?: string | null;
  image?: string | null;
  salaryTypeId?: number | null;
  salaryTypeName?: string | null;
  salary: number;
  phone?: string | null;
  address?: string | null;
  nationalId?: string | null;
  cityId?: number | null;
  education?: string | null;
  roleIds?: number[] | null;
}

export interface UserCreateType {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  nationalId?: string | null;
  cityId?: number | null;
  education?: string | null;
  salaryTypeId?: number | null;
  salary: number;
  roleIds?: number[] | null;
}

export interface UserEditType {
  id: number;
  name?: string | null;
  email?: string | null;
  salaryTypeId?: number | null;
  salary?: number;
  image?: string | null;
  phone?: string | null;
  address?: string | null;
  nationalId?: string | null;
  cityId?: number | null;
  education?: string | null;
  roleIds?: number[] | null;
}

// ============== API Response Types ==============
export interface ApiResponseType<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ============== Auth Types ==============
export interface LoginResponse {
  userId: number;
  userName: string;
  email?: string;
  token?: string;
  accessToken?: string;
  roles?: string[];
  expiresIn?: number;
}

// مثال لاستخدام أنواع الردود
export type BrancheGetByIdResponseType = ApiResponseType<BrancheGetByIdType>;
export type BrancheGetAllResponseType = ApiResponseType<BrancheGetAllType>;

// واجهة بيانات المستخدم
export interface UserDto {
  id: number;
  name: string;
  email?: string;
  role?: string;
  roles?: string[];
}

// ============== Instructor Types ==============
export enum InstructorSalaryTypeEnum {
  Monthly = 1,
  PerSession = 2,
  PerStudent = 3
}

export interface InstructorGetByIdType {
  id: number;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  nationalId: string | null;
  cityName: string | null;
  cityId: number | null;
  salary: number;
  salaryTypeId: number | null;
  salaryTypeName: string | null;
  coursesNames: string[] | null;
  coursesIds: number[] | null;
}

export interface InstructorCreateType {
  name: string;
  email: string;
  password?: string | null;
  phone: string | null;
  address: string | null;
  nationalId: string | null;
  cityId: number | null;
  salary: number;
  salaryTypeId: number | null;
  coursesIds: number[] | null;
}

export interface InstructorEditType {
  id: number;
  phone: string | null;
  address: string | null;
  nationalId: string | null;
  cityId: number | null;
  salary: number | null;
  salaryTypeId: number | null;
  coursesIds: number[] | null;
}

export interface InstructorGetAllType extends PaginationResultType<InstructorGetByIdType> {}
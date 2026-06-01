/**
 * dashboard/types.ts
 * Shared types, i18n copy, and constants for the dashboard.
 * Import from here — never duplicate in individual components.
 */

export type Lang = "en" | "ar";
export type Status = "Registered" | "Assessed" | "Passed" | "Enrolled";
export type PaymentStatus = "Paid" | "Pending" | "Partial";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Tamara" | "JeelPay" | "Promissory Note";
export type Gender = "Male" | "Female";
export type StudentType =
  | "New"
  | "Re-Registration"
  | "Enrollment"
  | "New Admission"
  | "Transfer";

export interface DashboardData {
  totalStudents: number;
  registered: number;
  assessed: number;
  passed: number;
  enrolled: number;
  seatsReserved: number;
  seatsAvailable: number;
  dailyRegistrations: { date: string; count: number }[];
  weeklyComparison: { thisWeek: number; lastWeek: number; growth: number };
  paymentSummary: {
    cash: number; bankTransfer: number; card: number; tamara: number; jeelPay: number; paid: number; partial: number; pending: number;
  };
  nationalitySummary: { saudi: number; nonSaudi: number; total: number };
  nationalityBySchool: { school: string; saudi: number; nonSaudi: number }[];
  seatUtilization: {
    bySchool: any[];
    byGrade: any[];
    bySection: any[];
  };
}

export const DASHBOARD_FALLBACK: DashboardData = {
  totalStudents: 0, registered: 0, assessed: 0, passed: 0, enrolled: 0,
  seatsReserved: 0, seatsAvailable: 0,
  dailyRegistrations: [],
  weeklyComparison: { thisWeek: 0, lastWeek: 0, growth: 0 },
  paymentSummary: { cash: 0, bankTransfer: 0, card: 0, tamara: 0, jeelPay: 0, paid: 0, partial: 0, pending: 0 },
  nationalitySummary: { saudi: 0, nonSaudi: 0, total: 0 },
  nationalityBySchool: [],
  seatUtilization: { bySchool: [], byGrade: [], bySection: [] },
};

export const COPY = {
  en: {
    title:              "School Admissions Management",
    subtitle:           "Structured CRM for registration, assessment, seat control, payment tracking, and enrollment.",
    protected:          "Protected admin workspace",
    adminOnly:          "Admin access is required.",
    signInAdmin:        "Sign in as an administrator to manage admissions records.",
    totalStudents:      "Total Students",
    registered:         "Registered",
    enrolled:           "Enrolled",
    seatsReserved:      "Seats Reserved",
    seatsAvailable:     "Seats Available",
    dailyRegistrations: "Daily registrations",
    weeklyComparison:   "Weekly comparison",
    thisWeek:           "This week",
    lastWeek:           "Last week",
    filters:            "Admin filters",
    dateFrom:           "Date from",
    dateTo:             "Date to",
    school:             "School",
    grade:              "Grade",
    allSchools:         "All schools",
    allGrades:          "All grades",
    schoolBreakdown:    "School Breakdown",
    seatSummary:        "Seat Summary",
    paymentStatus:      "Payment Status",
    capacityVsRegistered: "Capacity vs Registered vs Available",
    admissionPipeline:  "Admission Pipeline",
    noData:             "No records match the current filters.",
    workflowNote:       "Workflow is enforced: Registered → Assessed → Passed → Enrolled.",
    capacity:           "Capacity",
    available:          "Available",
  },
  ar: {
    title:              "نظام إدارة القبول المدرسي",
    subtitle:           "نظام منظم لإدارة التسجيل والتقييم والمقاعد والمدفوعات والالتحاق.",
    protected:          "مساحة عمل إدارية محمية",
    adminOnly:          "يتطلب صلاحيات المسؤول.",
    signInAdmin:        "سجّل الدخول كمسؤول للوصول.",
    totalStudents:      "إجمالي الطلاب",
    registered:         "المسجلون",
    enrolled:           "الملتحقون",
    seatsReserved:      "المقاعد المحجوزة",
    seatsAvailable:     "المقاعد المتاحة",
    dailyRegistrations: "التسجيلات اليومية",
    weeklyComparison:   "مقارنة أسبوعية",
    thisWeek:           "هذا الأسبوع",
    lastWeek:           "الأسبوع الماضي",
    filters:            "فلاتر الإدارة",
    dateFrom:           "من تاريخ",
    dateTo:             "إلى تاريخ",
    school:             "المدرسة",
    grade:              "الصف",
    allSchools:         "كل المدارس",
    allGrades:          "كل الصفوف",
    schoolBreakdown:    "تفاصيل المدارس",
    seatSummary:        "ملخص المقاعد",
    paymentStatus:      "حالة الدفع",
    capacityVsRegistered: "الطاقة مقابل المسجلين والمتاح",
    admissionPipeline:  "مسار القبول",
    noData:             "لا توجد سجلات.",
    workflowNote:       "تسلسل: مسجل → مُقيَّم → ناجح → ملتحق.",
    capacity:           "الطاقة",
    available:          "المتاح",
  },
} as const;

export type T = Record<keyof typeof COPY.en, string>;

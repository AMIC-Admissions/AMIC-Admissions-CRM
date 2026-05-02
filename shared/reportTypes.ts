/**
 * Report Module Types
 * Defines all types for dynamic filtering, field selection, and report generation
 */

export type StudentFilterField = 
  | "school"
  | "grade"
  | "section"
  | "gender"
  | "status"
  | "studentType";

export type AcademicFilterField =
  | "assessed"
  | "passed"
  | "reAssessment"
  | "passedRe";

export type PaymentFilterField =
  | "firstInstallment"
  | "secondInstallment"
  | "fullPayment"
  | "promissoryNote"
  | "tamara"
  | "jeelPay"
  | "paymentStatus";

export type SeatFilterField =
  | "seatAssigned"
  | "seatReserved"
  | "seatsAvailable";

export type DocumentFilterField =
  | "docsSigned"
  | "requirementsSubmitted"
  | "fileComplete";

export type FilterValue = string | boolean | number | null;

export interface ReportFilter {
  [key: string]: FilterValue | FilterValue[];
}

export type ReportFieldOption =
  | "studentName"
  | "studentId"
  | "gender"
  | "school"
  | "grade"
  | "section"
  | "parentMobile"
  | "status"
  | "studentType"
  | "assessed"
  | "passed"
  | "paymentStatus"
  | "paymentMethod"
  | "seatReserved"
  | "fileComplete"
  | "nationality"
  | "registrationDate";

export interface ReportRequest {
  filters: ReportFilter;
  selectedFields: ReportFieldOption[];
  limit?: number;
  offset?: number;
}

export interface ReportRow {
  [key: string]: any;
}

export interface ReportResponse {
  data: ReportRow[];
  total: number;
  filters: ReportFilter;
  selectedFields: ReportFieldOption[];
}

export interface ExportOptions {
  format: "pdf" | "excel";
  title?: string;
  includeFilterSummary?: boolean;
}

export const FIELD_LABELS: Record<ReportFieldOption, string> = {
  studentName: "Student Name",
  studentId: "ID Number",
  gender: "Gender",
  school: "School",
  grade: "Grade",
  section: "Section",
  parentMobile: "Parent Mobile",
  status: "Status",
  studentType: "Student Type",
  assessed: "Assessed",
  passed: "Passed",
  paymentStatus: "Payment Status",
  paymentMethod: "Payment Method",
  seatReserved: "Seat Reserved",
  fileComplete: "File Complete",
  nationality: "Nationality",
  registrationDate: "Registration Date",
};

export const QUICK_FILTERS = {
  unpaidStudents: {
    name: "Unpaid Students",
    filters: { paymentStatus: "Pending" },
  },
  incompleteFiles: {
    name: "Incomplete Files",
    filters: { fileComplete: false },
  },
  failedStudents: {
    name: "Failed Students",
    filters: { status: "Withdrawn" },
  },
  unseatedStudents: {
    name: "Unseated Students",
    filters: { seatReserved: false },
  },
  newStudents: {
    name: "New Students",
    filters: { studentType: "New" },
  },
};

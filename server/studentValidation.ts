/**
 * Student Validation & Calculation Helpers
 * Implements business logic for file completion and seat reservation
 */

/**
 * Calculate fileComplete status
 * File is complete only if BOTH docsSigned AND requirementsSubmitted are TRUE
 */
export function calculateFileComplete(docsSigned: boolean, requirementsSubmitted: boolean): boolean {
  return docsSigned && requirementsSubmitted;
}

/**
 * Calculate seatReserved status
 * Seat is reserved when:
 * 1. Student Type is Re-Registration OR Enrollment
 * OR
 * 2. Any payment is completed (1st Installment, Full Payment, Promissory Note, Tamara, JeelPay)
 */
export function calculateSeatReserved(
  studentType: string,
  firstInstallment: boolean,
  secondInstallment: boolean,
  fullPayment: boolean,
  promissoryNote: boolean,
  tamara: boolean,
  jeelPay: boolean
): boolean {
  // Check if student type qualifies for seat reservation
  const typeQualifies = studentType === "Re-Registration" || studentType === "Enrollment";

  // Check if any payment method is completed
  const paymentCompleted = firstInstallment || fullPayment || promissoryNote || tamara || jeelPay;

  return typeQualifies || paymentCompleted;
}

/**
 * Validate required fields for student creation
 */
export interface StudentValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStudentFields(data: {
  studentId?: string;
  name?: string;
  gender?: string;
  school?: string;
  grade?: string;
}): StudentValidationResult {
  const errors: string[] = [];

  if (!data.studentId || data.studentId.trim().length === 0) {
    errors.push("Student ID is required");
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Student Name is required");
  }

  if (!data.gender || !["Male", "Female"].includes(data.gender)) {
    errors.push("Gender must be Male or Female");
  }

  if (!data.school || data.school.trim().length === 0) {
    errors.push("School is required");
  }

  if (!data.grade || data.grade.trim().length === 0) {
    errors.push("Grade is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate boolean payment fields
 */
export function validatePaymentFields(data: {
  firstInstallment?: boolean;
  secondInstallment?: boolean;
  fullPayment?: boolean;
  promissoryNote?: boolean;
  tamara?: boolean;
  jeelPay?: boolean;
}): StudentValidationResult {
  const errors: string[] = [];

  // Check that all payment fields are booleans
  const paymentFields = [
    "firstInstallment",
    "secondInstallment",
    "fullPayment",
    "promissoryNote",
    "tamara",
    "jeelPay",
  ];

  for (const field of paymentFields) {
    const value = (data as any)[field];
    if (value !== undefined && typeof value !== "boolean") {
      errors.push(`${field} must be a boolean value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate assessment fields
 */
export function validateAssessmentFields(data: {
  assessed?: boolean;
  passed?: boolean;
  reAssessment?: boolean;
  passedRe?: boolean;
}): StudentValidationResult {
  const errors: string[] = [];

  // If passed is true, assessed must also be true
  if (data.passed && !data.assessed) {
    errors.push("Student cannot be marked as passed without being assessed first");
  }

  // If passedRe is true, reAssessment must be true
  if (data.passedRe && !data.reAssessment) {
    errors.push("Student cannot be marked as passed (re) without re-assessment");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate document fields
 */
export function validateDocumentFields(data: {
  docsSigned?: boolean;
  requirementsSubmitted?: boolean;
}): StudentValidationResult {
  const errors: string[] = [];

  // Both fields must be boolean if provided
  if (data.docsSigned !== undefined && typeof data.docsSigned !== "boolean") {
    errors.push("docsSigned must be a boolean value");
  }

  if (data.requirementsSubmitted !== undefined && typeof data.requirementsSubmitted !== "boolean") {
    errors.push("requirementsSubmitted must be a boolean value");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive student validation
 */
export function validateStudent(data: any): StudentValidationResult {
  const allErrors: string[] = [];

  // Validate required fields
  const requiredValidation = validateStudentFields(data);
  allErrors.push(...requiredValidation.errors);

  // Validate payment fields
  const paymentValidation = validatePaymentFields(data);
  allErrors.push(...paymentValidation.errors);

  // Validate assessment fields
  const assessmentValidation = validateAssessmentFields(data);
  allErrors.push(...assessmentValidation.errors);

  // Validate document fields
  const documentValidation = validateDocumentFields(data);
  allErrors.push(...documentValidation.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

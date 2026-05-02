# Project TODO

- [x] Implement student management with add, edit, delete, and required fields: name, student ID, gender, nationality, school, grade, status, registration date, payment status, payment method, and file complete flag.
- [x] Enforce strict admissions status progression from Registered to Assessed to Passed to Enrolled with no skipping and no reversal.
- [x] Block enrollment when no seats are available for the student's selected school and grade.
- [x] Implement payment tracking with only Paid or Pending statuses and only Cash, Tamara, and JeelPay payment methods.
- [x] Build dashboard KPI cards for total students, registered, enrolled, seats reserved, and seats available.
- [x] Build daily registrations bar chart.
- [x] Build weekly comparison view for this week versus last week.
- [x] Implement seat management capacity by school and grade.
- [x] Auto-calculate registered, reserved, and available seats by school and grade.
- [x] Display low-seat alert whenever available seats are 3 or fewer.
- [x] Implement admin filters by date range, school, and grade.
- [x] Implement full English and Arabic UI text support.
- [x] Activate RTL layout only when Arabic language is selected.
- [x] Implement mobile-first responsive interface for desktop and mobile screens.
- [x] Apply professional architectural blueprint visual style with deep royal blue background, precise grid pattern, white technical line drawings, dimension markers, and structured typography.
- [x] Protect all admin operations on the frontend.
- [x] Protect all admin operations on the backend with role-based procedures.
- [x] Use the provided admissions spreadsheet as a reference for initial school, grade, capacity, and student data where feasible.
- [x] Add automated Vitest coverage for workflow progression, enrollment seat blocking, payment method restrictions, and admin-only backend operations.
- [x] Run type checks, tests, and final status validation before delivery.
- [x] Localize every remaining hardcoded UI string, toast, option label, badge, and status/payment/gender label so English and Arabic coverage is complete.
- [x] Add explicit loading, error, and empty states for dashboard KPI cards, daily registrations chart, and weekly comparison instead of defaulting to misleading zeros or empty charts.
- [x] Verify and document successful workbook-based seed import so initial spreadsheet-derived data is proven present.
- [x] Add explicit loading, error, and empty-state UI for dashboard KPI cards instead of symbolic placeholders.


## Phase 2: Smart Seat Allocation Engine

- [x] Extend database schema: add Section field to students table, add Seats table with School/Grade/Section/Capacity/ReservedSeats
- [x] Implement seat allocation logic: auto-assign section based on gender and grade rules
- [x] Implement seat reservation logic: reserve seat when Student Type = Re-Registration/Enrollment OR payment conditions met
- [x] Implement seat release logic: release seat when Status = Withdrawn
- [x] Add validation: prevent registration if no seats available
- [x] Add validation: prevent wrong gender in wrong section (Grade 1+)

## Phase 3: Enhanced Student Management

- [x] Update student form to include Section field (auto-assigned, read-only)
- [x] Update student form to include Student Type dropdown (Re-Registration, Enrollment, etc.)
- [x] Update student form to include payment fields (Payment Status, Payment Method, Payment Date)
- [x] Implement section auto-assignment on student creation
- [x] Implement seat reservation on student creation/update based on rules
- [x] Implement seat release on student withdrawal

## Phase 4: Comprehensive Dashboard

- [x] Add filters: Date range, School, Grade
- [x] Build KPI cards: Total Students, Registered, Enrolled, Seats Reserved, Seats Available
- [x] Build daily registrations chart (line chart)
- [x] Build weekly comparison chart (this week vs last week + growth %)
- [x] Build admission funnel (Registered → Assessed → Passed → Enrolled)
- [x] Build payment analysis (Cash vs Tamara vs JeelPay + Paid vs Pending)
- [x] Build seat utilization charts (by School, by Grade, by Section)
- [x] Add low-seat alert (≤ 3 available seats)

## Phase 5: Testing & Validation

- [x] Test seat allocation logic with various gender/grade combinations
- [x] Test seat reservation and release workflows
- [x] Test dashboard filters and real-time updates
- [x] Test validation rules and error handling
- [x] Run TypeScript checks and Vitest suite
- [x] Verify production build


## Phase 6: Advanced Search, Seat Availability Page, and Enhanced Dashboard

### Student Search & Edit
- [x] Add global search API endpoint supporting ID, Name, Grade, Parent Mobile (case-insensitive, partial match)
- [x] Implement debounced search UI with live results table
- [x] Add edit modal with pre-filled student data
- [x] Implement update API with seat logic re-run on grade/status changes

### Seat Availability Page
- [x] Create new page: /seat-availability
- [x] Add filters: School, Grade, Gender dropdowns
- [x] Implement gender-aware section logic (Kindergarten shared, Grade 1+ segregated)
- [x] Display: Total Capacity, Reserved Seats, Available Seats
- [x] Implement backend API: GET /seats/availability?school=&grade=&gender=

### Enhanced Professional Dashboard
- [x] Add KPI cards: Total Students, Passed, Failed, Registered, Enrollment, Seats Reserved, Seats Available
- [x] Build School Breakdown table with Assessed/Passed/Registered/Payment methods/Seats columns
- [x] Build Seat Summary table with Capacity/Reserved/Available/Occupancy%
- [x] Build Payment Status table with counts and percentages
- [x] Build Seats Remaining by Grade table
- [x] Add Capacity vs Registered vs Available bar chart
- [x] Add Admission Pipeline chart (Assessed→Passed→Registered→Reserved)
- [x] Add low-seat alert (≤3 available seats)
- [x] Implement dashboard filters and real-time updates


## Phase 7: Advanced Reports Module

### Backend API & Data Model
- [x] Design report request/response types with Zod validation
- [x] Create dynamic SQL query builder for flexible filtering
- [x] Implement report generation tRPC procedure
- [x] Add support for all filter categories (Student, Academic, Payment, Seat, Document)
- [x] Optimize query performance with proper indexing

### Frontend Reports Page
- [x] Create /reports page component
- [x] Build dynamic filter panel with collapsible sections
- [x] Implement field selection checkboxes
- [x] Add real-time report preview table
- [x] Implement "Generate Report" button

### Export Functionality
- [x] Implement PDF export with clean layout
- [x] Add PDF title and filter summary
- [x] Implement Excel export (.xlsx)
- [x] Add download buttons for both formats

### Advanced Features
- [x] Add quick filter templates (Unpaid Students, Incomplete Files, etc.)
- [x] Implement report template saving
- [x] Add pagination for large datasets (limit/offset)
- [x] Add loading states and error handling


## Phase 8: Student Data Model Upgrade (AJYAL AL-MAARIFA)

### Database Schema Redesign
- [x] Expand students table with all required fields (DOB, nationality, fatherId, motherMobile, etc.)
- [x] Add computed columns for fileComplete and seatReserved logic
- [x] Create database migration for schema changes
- [x] Add validation constraints and indexes

### Backend API Updates
- [x] Update createStudent procedure with all new fields
- [x] Update updateStudent procedure with validation
- [x] Add field-level validation (required fields, Yes/No booleans)
- [x] Implement fileComplete auto-calculation logic
- [x] Implement seatReserved auto-calculation logic
- [x] Update searchStudents to include new fields

### Frontend Form UI Redesign
- [x] Create tabbed/sectioned student form (Student Info, Enrollment, Assessment, Payment, Documents, Parent Info)
- [x] Build Student Information section (Name, ID, DOB)
- [x] Build Personal Details section (Gender, Nationality)
- [x] Build Enrollment section (School, Grade, Student Type, Date of Join)
- [x] Build Assessment section (Assessment, Passed, Re-Assessment, Passed Re)
- [x] Build Status section (Registration, Enrollment, Transfer)
- [x] Build Payment section (1st/2nd Installment, Full Payment, Promissory Note, Tamara, JeelPay)
- [x] Build Documents section (Docs Signed, Requirements Submitted, File Complete display)
- [x] Build Parent/Guardian section (Father ID, Father Mobile, Mother ID, Mother Mobile)
- [x] Add form validation and error messages

### Student List Table Update
- [x] Update table columns to show: Name, ID, School, Grade, Status, Payment Status, File Complete
- [x] Add calculated Payment Status column
- [x] Add sorting and filtering by key columns
- [x] Update edit modal to work with new schema

### Integration & Testing
- [x] Update dashboard to work with new fields
- [x] Update reports module to support new fields
- [x] Update seat availability logic with new fields
- [x] Run full test suite
- [x] Test form validation and calculations


## Phase 9: Data Consistency Fix & System Upgrade

### Data Consistency Fix (CRITICAL - DO FIRST)
- [ ] Create data mapping script to fix existing records
- [ ] Set File Complete = docs_signed AND req_submitted
- [ ] Set Seat Reserved based on student_type and payment fields
- [ ] Recalculate Payment Status (Paid/Pending/Partial)
- [ ] Rebuild seats table with correct reserved_seats counts
- [ ] Backfill NULL values with FALSE for boolean fields
- [ ] Validate enum values and normalize data
- [ ] Verify dashboard numbers after fix
- [ ] Confirm seats reserved > 0 and available calculated correctly

### Authentication System
- [ ] Create users table with id, username, password (hashed), role
- [ ] Implement password hashing (bcrypt)
- [ ] Add login page (/login) with username/password form
- [ ] Implement JWT-based session management
- [ ] Add role-based access control (Admin/Staff)
- [ ] Protect all routes with authentication middleware
- [ ] Create logout functionality

### Navigation & Layout
- [ ] Reorganize DashboardLayout with new navigation structure
- [ ] Add navigation items: Dashboard, Students, Search & Edit, Seat Availability, Import/Export, Users (Admin only)
- [ ] Create multi-page admin layout with sidebar
- [ ] Add role-based menu visibility

### Pages Implementation
- [ ] Students page (/students) with table and add button
- [ ] Search & Edit page (/search) with search and results
- [ ] Seat Availability page (/seats) with filters
- [ ] Import/Export page (/data) with upload and download
- [ ] Users Management page (/users) - Admin only

### System Integration & Testing
- [ ] Test data consistency after fix
- [ ] Verify all calculations work correctly
- [ ] Test authentication and authorization
- [ ] Test all page navigation and functionality
- [ ] Verify seat logic and payment logic preserved
- [ ] Run full test suite
- [ ] Production readiness check


## Phase 9B: Data Consistency & Logic Fix (CRITICAL)

### Data Review & Fixes
- [x] Review current data state: Seats Reserved, Available, Payments
- [x] Fix Seats Reserved calculation (should be > 0 after fix)
- [x] Fix Seats Available calculation (capacity - reserved)
- [x] Verify payment distribution accuracy
- [x] Confirm all tables populated correctly
- [x] Check dashboard numbers match database

### File Complete Logic Update
- [x] Update File Complete for New Admission: require docs_signed AND req_submitted
- [x] Update File Complete for other types: default to TRUE
- [x] Update dataFix.ts with student-type-specific logic
- [x] Add validation to prevent marking File Complete without docs for new students

### UI Validation & Fields
- [x] Show Docs Signed/Requirements fields for all types
- [x] Mark fields optional for non-New Admission types
- [x] Add validation in StudentFormTabs
- [x] Update edit modal field visibility

### Dashboard & Reports
- [ ] Verify dashboard reflects correct File Complete counts
- [ ] Verify reports use new logic
- [ ] Test edge cases (withdrawn, partial payments, missing data)
- [ ] Confirm all calculations are accurate


## Phase 10: Seat Master Dataset Implementation

### Schema & Data
- [x] Create seat_master table with school, grade, section, gender, capacity fields
- [x] Create migration for seat_master table
- [x] Insert complete Seat Master dataset (Kids Gate, AMIS Girls, AMIS Boys)
- [x] Verify all 100+ seat records inserted correctly

### Seat Calculation Logic
- [x] Update seat calculation to query seat_master instead of generating from students
- [x] Calculate reserved = count of students in seat
- [x] Calculate available = capacity - reserved
- [x] Update dataFix.ts to populate from seat_master
- [x] Update getDashboardData to use seat_master

### Dashboard & Reports
- [x] Update dashboard to show correct capacity/reserved/available from seat_master
- [x] Update reports to use seat_master for seat information
- [x] Verify all seat displays are accurate

### Testing & Verification
- [ ] Test seat calculations with various student scenarios (awaiting migration)
- [ ] Verify seat_master is independent from student creation
- [ ] Test dashboard seat numbers match seat_master
- [ ] Confirm all seat operations use seat_master as source of truth


## Phase 11: Production-Ready System (CRITICAL)

### Dashboard Calculation Fixes
- [ ] Fix reserved_seats calculation using seat_master + students
- [ ] Fix available_seats = capacity - reserved_seats
- [ ] Ensure all classes appear even if empty
- [ ] Fix payment method distribution (Cash, Bank Transfer, Card, Tamara, JeelPay)
- [ ] Fix payment status aggregation (Paid, Pending, Partial)
- [ ] Verify dashboard numbers are accurate
- [ ] Add fallback for missing seat_master table

### Professional Admin UI
- [ ] Build sidebar navigation layout
- [ ] Build header with user info and logout
- [ ] Create responsive grid layout
- [ ] Style cards and tables
- [ ] Add breadcrumb navigation

### Students Page (/students)
- [ ] Create Students page component
- [ ] Build students table with key columns
- [ ] Add "Add Student" button
- [ ] Integrate tabbed form modal
- [ ] Add Import/Export buttons

### Import/Export
- [ ] Create Import page component
- [ ] Build Excel upload with validation
- [ ] Apply File Complete and Seat Reserved logic
- [ ] Create Export functionality (Excel)
- [ ] Test with sample data

### Search & Edit
- [ ] Add global search in header
- [ ] Implement search by Name/ID/Mobile/Grade
- [ ] Build edit modal with tabbed form
- [ ] Trigger seat logic on update
- [ ] Add validation

### Seat Availability Page
- [ ] Create Seat Availability page
- [ ] Add School/Grade/Gender filters
- [ ] Display Capacity/Reserved/Available
- [ ] Show all classes from seat_master
- [ ] Add real-time updates

### Authentication & Users
- [ ] Create login page
- [ ] Implement JWT authentication
- [ ] Create users management page (admin only)
- [ ] Add role-based access control
- [ ] Protect all routes

### Final Testing
- [ ] Test all dashboard calculations
- [ ] Verify seat logic works correctly
- [ ] Test payment calculations
- [ ] Test authentication and authorization
- [ ] Test all pages and features
- [ ] Verify production build

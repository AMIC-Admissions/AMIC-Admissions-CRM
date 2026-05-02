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

import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ReportsSkeleton } from "@/components/PageSkeletons";
import { SchoolComparison } from "@/components/SchoolComparison";
import { AtRiskReport } from "@/components/AtRiskReport";
import { ScheduledReports } from "@/components/ScheduledReports";
import { exportReportToPDF } from "@/lib/exportPDF";
import { exportReportToExcel } from "@/lib/exportExcel";
import { AlertTriangle, Building2, ChevronDown, Download, FileText, Filter, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { FIELD_LABELS, QUICK_FILTERS, ReportFieldOption } from "@shared/reportTypes";

type Lang = "en" | "ar";

const translations = {
  en: {
    title: "Reports",
    subtitle: "Generate custom reports with flexible filtering and export options",
    protected: "Protected admin workspace",
    adminOnly: "Admin access is required",
    signInAdmin: "Sign in as an administrator to access reports",
    filters: "Filters",
    studentFilters: "Student Filters",
    academicFilters: "Academic Filters",
    paymentFilters: "Payment Filters",
    seatFilters: "Seat Filters",
    documentFilters: "Document Filters",
    selectFields: "Select Fields to Include",
    generateReport: "Generate Report",
    downloadPDF: "Download PDF",
    downloadExcel: "Download Excel",
    school: "School",
    grade: "Grade",
    section: "Section",
    gender: "Gender",
    status: "Status",
    studentType: "Student Type",
    assessed: "Assessed",
    passed: "Passed",
    paymentStatus: "Payment Status",
    paymentMethod: "Payment Method",
    seatReserved: "Seat Reserved",
    fileComplete: "File Complete",
    yes: "Yes",
    no: "No",
    allSchools: "All Schools",
    allGrades: "All Grades",
    allSections: "All Sections",
    loading: "Loading...",
    error: "Error loading data",
    noData: "No records found",
    reportResults: "Report Results",
    quickFilters: "Quick Filters",
    unpaidStudents: "Unpaid Students",
    incompleteFiles: "Incomplete Files",
    failedStudents: "Failed Students",
    unseatedStudents: "Unseated Students",
    newStudents: "New Students",
    applyFilter: "Apply",
    clearFilters: "Clear All",
    recordsFound: "records found",
  },
  ar: {
    title: "التقارير",
    subtitle: "إنشاء تقارير مخصصة مع خيارات التصفية والتصدير المرنة",
    protected: "مساحة إدارية محمية",
    adminOnly: "يتطلب الوصول الإداري",
    signInAdmin: "سجل الدخول كمدير للوصول إلى التقارير",
    filters: "الفلاتر",
    studentFilters: "فلاتر الطالب",
    academicFilters: "الفلاتر الأكاديمية",
    paymentFilters: "فلاتر الدفع",
    seatFilters: "فلاتر المقاعد",
    documentFilters: "فلاتر المستندات",
    selectFields: "اختر الحقول المراد تضمينها",
    generateReport: "إنشاء تقرير",
    downloadPDF: "تحميل PDF",
    downloadExcel: "تحميل Excel",
    school: "المدرسة",
    grade: "الصف",
    section: "القسم",
    gender: "الجنس",
    status: "الحالة",
    studentType: "نوع الطالب",
    assessed: "تم تقييمه",
    passed: "ناجح",
    paymentStatus: "حالة الدفع",
    paymentMethod: "طريقة الدفع",
    seatReserved: "المقعد محجوز",
    fileComplete: "الملف مكتمل",
    yes: "نعم",
    no: "لا",
    allSchools: "كل المدارس",
    allGrades: "كل الصفوف",
    allSections: "كل الأقسام",
    loading: "جاري التحميل...",
    error: "خطأ في تحميل البيانات",
    noData: "لم يتم العثور على سجلات",
    reportResults: "نتائج التقرير",
    quickFilters: "الفلاتر السريعة",
    unpaidStudents: "الطلاب غير المدفوعين",
    incompleteFiles: "الملفات غير المكتملة",
    failedStudents: "الطلاب الفاشلون",
    unseatedStudents: "الطلاب بدون مقاعد",
    newStudents: "الطلاب الجدد",
    applyFilter: "تطبيق",
    clearFilters: "مسح الكل",
    recordsFound: "سجل تم العثور عليه",
  },
};

export default function Reports() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<"custom" | "comparison" | "at-risk" | "scheduled">("custom");

  // Filters state
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedFields, setSelectedFields] = useState<ReportFieldOption[]>([
    "studentName",
    "studentId",
    "school",
    "grade",
    "status",
    "paymentStatus",
  ]);

  // UI state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    student: true,
    academic: false,
    payment: false,
    seat: false,
    document: false,
  });

  // Queries
  // filter options are static — cache for 10 min, skip refetch on focus
  const filterOptions = trpc.admissions.getReportFilterOptions.useQuery(undefined, {
    staleTime: 600_000, gcTime: 1_800_000, refetchOnWindowFocus: false,
  });
  // report results are on-demand only (enabled: false until user clicks Generate)
  const reportQuery = trpc.admissions.generateReport.useQuery(
    { filters, selectedFields, limit: 1000 },
    { enabled: false, staleTime: 0 }
  );

  const handleGenerateReport = async () => {
    try {
      const result = await reportQuery.refetch();
      if (result.data) {
        toast.success(`Generated report with ${result.data.total} records`);
      }
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const handleQuickFilter = (quickFilterKey: keyof typeof QUICK_FILTERS) => {
    const quickFilter = QUICK_FILTERS[quickFilterKey];
    setFilters(quickFilter.filters);
    handleGenerateReport();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSelectedFields([
      "studentName",
      "studentId",
      "school",
      "grade",
      "status",
      "paymentStatus",
    ]);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleField = (field: ReportFieldOption) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  if (!isAdmin) {
    return (
      <div className="blueprint-bg min-h-screen p-4 sm:p-8">
        <Card className="technical-panel mx-auto mt-16 max-w-2xl text-white dimension-frame">
          <CardHeader>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">{t.protected}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <p>{user ? t.adminOnly : t.signInAdmin}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (filterOptions.isLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="blueprint-bg min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <div className="container space-y-6 py-6 sm:py-8">
        {/* Header */}
        <section className="technical-panel dimension-frame overflow-hidden rounded-2xl p-5 sm:p-8">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">{t.title}</h1>
              <p className="mt-4 max-w-3xl text-base font-medium text-white/75 sm:text-lg">{t.subtitle}</p>
            </div>
            <Button
              className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
            >
              {lang === "en" ? "العربية" : "English"}
            </Button>
          </div>
        </section>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "custom"
                ? "bg-cyan-200 text-[#031844]"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <FileText className="h-4 w-4" />
            Custom Report
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "comparison"
                ? "bg-cyan-200 text-[#031844]"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Building2 className="h-4 w-4" />
            School Comparison
          </button>
          <button
            onClick={() => setActiveTab("at-risk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "at-risk"
                ? "bg-amber-300 text-[#031844]"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            At-Risk Students
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "scheduled"
                ? "bg-emerald-300 text-[#031844]"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            <Mail className="h-4 w-4" />
            Scheduled Reports
          </button>
        </div>

        {/* School Comparison tab */}
        {activeTab === "comparison" && <SchoolComparison />}

        {activeTab === "at-risk" && <AtRiskReport />}

        {activeTab === "scheduled" && <ScheduledReports />}

        {/* Custom Report tab */}
        {activeTab === "custom" && <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* Filters Panel */}
          <Card className="technical-panel text-white h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
                <Filter className="h-5 w-5 text-cyan-200" /> {t.filters}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Filters */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/75">{t.quickFilters}</p>
                <div className="space-y-2">
                  {Object.entries(QUICK_FILTERS).map(([key, filter]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-xs"
                      onClick={() => handleQuickFilter(key as keyof typeof QUICK_FILTERS)}
                    >
                      {filter.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10" />

              {/* Student Filters */}
              <FilterSection
                title={t.studentFilters}
                section="student"
                expanded={expandedSections.student}
                onToggle={() => toggleSection("student")}
              >
                <FilterSelect
                  label={t.school}
                  options={filterOptions.data?.schools || []}
                  value={filters.school || ""}
                  onChange={(val) => setFilters({ ...filters, school: val || undefined })}
                />
                <FilterSelect
                  label={t.grade}
                  options={filterOptions.data?.grades || []}
                  value={filters.grade || ""}
                  onChange={(val) => setFilters({ ...filters, grade: val || undefined })}
                />
                <FilterSelect
                  label={t.gender}
                  options={["Male", "Female"]}
                  value={filters.gender || ""}
                  onChange={(val) => setFilters({ ...filters, gender: val || undefined })}
                />
                <FilterSelect
                  label={t.status}
                  options={filterOptions.data?.statuses || []}
                  value={filters.status || ""}
                  onChange={(val) => setFilters({ ...filters, status: val || undefined })}
                />
              </FilterSection>

              {/* Payment Filters */}
              <FilterSection
                title={t.paymentFilters}
                section="payment"
                expanded={expandedSections.payment}
                onToggle={() => toggleSection("payment")}
              >
                <FilterSelect
                  label={t.paymentStatus}
                  options={["Pending", "Partial", "Paid"]}
                  value={filters.paymentStatus || ""}
                  onChange={(val) => setFilters({ ...filters, paymentStatus: val || undefined })}
                />
                <FilterSelect
                  label={t.paymentMethod}
                  options={filterOptions.data?.paymentMethods || []}
                  value={filters.paymentMethod || ""}
                  onChange={(val) => setFilters({ ...filters, paymentMethod: val || undefined })}
                />
              </FilterSection>

              {/* Document Filters */}
              <FilterSection
                title={t.documentFilters}
                section="document"
                expanded={expandedSections.document}
                onToggle={() => toggleSection("document")}
              >
                <FilterCheckbox
                  label={t.fileComplete}
                  checked={filters.fileComplete === true}
                  onChange={(val) => setFilters({ ...filters, fileComplete: val ? true : undefined })}
                />
              </FilterSection>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-cyan-200 text-[#031844] hover:bg-white"
                  onClick={handleGenerateReport}
                >
                  {t.generateReport}
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  {t.clearFilters}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Field Selection */}
            <Card className="technical-panel text-white">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase">{t.selectFields}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(
                    [
                      "studentName",
                      "studentId",
                      "gender",
                      "school",
                      "grade",
                      "section",
                      "status",
                      "studentType",
                      "assessed",
                      "passed",
                      "paymentStatus",
                      "paymentMethod",
                      "seatReserved",
                      "fileComplete",
                      "nationality",
                      "registrationDate",
                    ] as ReportFieldOption[]
                  ).map((field) => (
                    <label key={field} className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-white/10">
                      <Checkbox
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => toggleField(field)}
                      />
                      {FIELD_LABELS[field]}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Report Results */}
            <Card className="technical-panel text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
                  <FileText className="h-5 w-5 text-cyan-200" /> {t.reportResults}
                  {reportQuery.data && (
                    <Badge className="ml-auto bg-cyan-200 text-[#031844]">
                      {reportQuery.data.total} {t.recordsFound}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportQuery.isLoading ? (
                  <div className="space-y-px">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-4 border-b border-white/[0.06] px-4 py-3"
                        style={{ opacity: 1 - i * 0.12 }}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <div key={j} className="flex-1 h-3 bg-white/10 animate-pulse rounded" />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : reportQuery.data && reportQuery.data.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse text-sm">
                      <thead className="bg-white/10 text-xs uppercase tracking-[0.18em] text-cyan-100">
                        <tr>
                          {selectedFields.map((field) => (
                            <th className="border border-white/10 px-3 py-3 text-start" key={field}>
                              {FIELD_LABELS[field]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportQuery.data.data.map((row, idx) => (
                          <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                            {selectedFields.map((field) => (
                              <td key={field} className="px-3 py-3 text-white/80">
                                {String(row[field] || "—")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-white/70">{t.noData}</div>
                )}
              </CardContent>
            </Card>

            {/* Export Options */}
            {reportQuery.data && reportQuery.data.data.length > 0 && (
              <Card className="technical-panel text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
                    <Download className="h-5 w-5 text-cyan-200" /> Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button
                    className="flex-1 bg-cyan-200 text-[#031844] hover:bg-white"
                    onClick={() => {
                      try {
                        exportReportToPDF({
                          title: "Student Report",
                          filters,
                          selectedFields,
                          data: reportQuery.data!.data,
                        });
                        toast.success("PDF downloaded successfully");
                      } catch (error) {
                        toast.error("Failed to export PDF");
                      }
                    }}
                  >
                    {t.downloadPDF}
                  </Button>
                  <Button
                    className="flex-1 bg-cyan-200 text-[#031844] hover:bg-white"
                    onClick={() => {
                      try {
                        exportReportToExcel({
                          title: "Student Report",
                          filters,
                          selectedFields,
                          data: reportQuery.data!.data,
                        });
                        toast.success("Excel file downloaded successfully");
                      } catch (error) {
                        toast.error("Failed to export Excel");
                      }
                    }}
                  >
                    {t.downloadExcel}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>} {/* end custom tab */}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  section,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  section: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/75 hover:bg-white/10"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/75">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-white/15 bg-white/5 px-2 text-sm text-white"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-white/10">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
